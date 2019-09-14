/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable no-loop-func */
import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager
} from "react-notifications";
import { confirm } from "../confirmation/confirmation";
import axios from "axios";
import { CSVLink } from "react-csv";
import "react-table/react-table.css";
import "react-notifications/lib/notifications.css";
import { Redirect } from "react-router-dom";

import Spinner from "../loading-spinner/loading-spinner";
import InputID from "../inputID/inputID";
import Card from "../card/card";

const { encryptWithProof } = require("paillier-in-set-zkp");
const paillier = require("paillier-js");
var bigInt = require("big-integer");

class Candidates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pubKey: [],
      candidates: [],
      vote: undefined,
      voteName: undefined,
      bits: undefined,
      random: undefined,
      isFinish: false,
      id: undefined,
      candidateID: undefined,
      isSending: false,
      isDowloaded: false,
      validScores: [],
      publicKey: undefined,
      loading: false
    };
    this.handleOnClickVote = this.handleOnClickVote.bind(this);
    this.output = this.output.bind(this);
  }

  componentDidMount() {
    axios
      .get("/voting-app/candidates/")
      .then(response => response.data)
      .then(candidates => {
        this.setState({ candidates });
        console.log("Candidates:", this.state.candidates);
        const validScores = candidates.map(function(obj) {
          return obj.Record.Vote;
        });
        this.setState({ validScores });
        console.log("Valid scores: ", this.state.validScores);
      });

    axios
      .get("/voting-app/getPubKey/")
      .then(response => response.data)
      .then(pubKey => {
        this.setState({ pubKey });
        const publicKey = new paillier.PublicKey(
          bigInt(pubKey.n),
          bigInt(pubKey.g)
        );
        this.setState({ publicKey });
        console.log("Public Key:", this.state.publicKey);
      });

    axios
      .get("/voting-app/getBits/")
      .then(response => response.data)
      .then(bits => {
        this.setState({ bits });
        console.log("Bits:", this.state.bits);
      });
  }

  handleOnClickVote = async () => {
    if (this.state.vote === undefined) {
      NotificationManager.error("Choose one candidate!", "Your vote is empty");
      return;
    }

    if (this.state.id === undefined) {
      NotificationManager.error("Enter your ID!", "Your ID is empty");
      return;
    }
    await confirm(
      "Are you sure vote - " + this.state.voteName + "?",
      "OK",
      "Back",
      "Confimation your vote"
    ).then(() => {
      this.state.loading = true;
      console.log(this.state.publicKey.toString());
      console.time("encrypt");
      var temp = false;
      do {
        temp = false;
        var [cipher, proof, random] = encryptWithProof(
          this.state.publicKey,
          this.state.vote,
          this.state.validScores,
          this.state.bits
        );
        console.log(proof);
        proof.forEach(proof => {
          proof.forEach(element => {
            if (element < 0) {
              temp = true;
            }
          });
        });
      } while (temp);
      console.timeEnd("encrypt");
      this.setState({ random: random.toString() });
      this.state.random = random.toString();
      var vote = {
        id: this.state.id,
        Vote: cipher,
        Proof: proof
      };
      console.log(this.state.voteName);
      console.log(vote);
      console.time("verify");
      axios
        .post("/voting-app/vote", vote)
        .then(response => {
          console.log(response);
          if (response.data === true) {
            /*this.setState({ isFinish: true });
            this.state.isFinish = true;*/
            this.setState({ loading: false });
            NotificationManager.success("Your vote is counted :-)", "SUCCESS!");
            console.timeEnd("verify");
          } else {
            NotificationManager.error("Your vote is not counted :-(", "ERROR!");
            this.setState({ loading: false });
          }
        })
        .catch(error => {
          console.log(error);
          NotificationManager.error("Faild :-(", "ERROR!");
          this.setState({ loading: false });
        });
    });
  };

  output = e => {
    e.preventDefault();
    const id = e.target.value;
    this.setState({ id });
    console.log(e.target.value);
  };

  handleDownload = () => {
    console.log("TU!");
    confirm("Are you want verify your vote?", "OK", "Back", "Vote verify").then(
      this.setState({ isDowloaded: true })
    );
  };

  render() {
    const divStyle = {
      fontWeight: "bold"
    };

    const columns = [
      {
        Header: "Vote",
        style: {
          textAlign: "center"
        },
        Cell: props => {
          return (
            <div className="radio">
              <label>
                <input
                  type="radio"
                  name="optradio"
                  onClick={() => {
                    this.state.vote = props.original.Record.Vote;
                    this.state.voteName = props.original.Record.Name;
                    this.state.candidateID = props.original.Record.ID;
                  }}
                />
              </label>
            </div>
          );
        },
        sortable: false,
        width: 75,
        maxWidth: 75,
        minWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "ID",
        accessor: "Record.ID",
        style: {
          textAlign: "center"
        },
        width: 75,
        maxWidth: 75,
        minWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "Name",
        accessor: "Record.Name",
        style: {
          textAlign: "center"
        },
        headerStyle: divStyle
      },
      {
        Header: "Party",
        accessor: "Record.Description",
        style: {
          textAlign: "center"
        },
        filterable: false,
        headerStyle: divStyle
      },
      {
        Header: "Age",
        accessor: "Record.Age",
        style: {
          textAlign: "center"
        },
        filterable: false,
        headerStyle: divStyle
      }
    ];

    return (
      <div id="page-content">
        <div>
          <br />
          <Card
            title="Welcome in voting app."
            text="Choose one candidate and submit your vote."
          />
          <br />
          <div className="sweet-loading">
            <InputID output={this.output} />
            <ReactTable
              className="-striped -highlight"
              defaultPageSize={5}
              minRows={1}
              columns={columns}
              data={this.state.candidates}
            ></ReactTable>
            <br />
            {!this.state.isFinish && (
              <Button variant="success" onClick={this.handleOnClickVote}>
                Vote
              </Button>
            )}
            {this.state.isFinish && (
              <CSVLink
                data={this.state.id + "\n" + this.state.random}
                filename={"my-file.csv"}
                className="btn btn-info"
                target="_blank"
                onClick={this.handleDownload}
              >
                Download me
              </CSVLink>
            )}
            {this.state.isDowloaded && (
              <Redirect
                to={{
                  pathname: "/verify"
                }}
              />
            )}
            <Spinner show={this.state.loading} />
            <NotificationContainer />
          </div>
        </div>
      </div>
    );
  }
}

export default Candidates;
