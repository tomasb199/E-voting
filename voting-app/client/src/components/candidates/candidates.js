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
import "./candidates.css";

const paillier = require("paillier-js");
var bigInt = require("big-integer");

class Candidates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      candidates: [],
      verifyCandidates: [],
      voteName: undefined,
      isFinish: false,
      id: undefined,
      candidateID: undefined,
      isDowloaded: false,
      publicKey: undefined,
      loading: false
    };
    this.handleOnClickVote = this.handleOnClickVote.bind(this);
    this.output = this.output.bind(this);
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then(response => response.data)
      .then(candidates => {
        this.setState({ candidates });
        console.log("Candidates:", this.state.candidates);
      });

    axios
      .get("http://localhost:8000/voting-app/getPubKey/")
      .then(response => response.data)
      .then(pubKey => {
        const publicKey = new paillier.PublicKey(
          bigInt(pubKey.n),
          bigInt(pubKey.g)
        );
        this.setState({ publicKey });
        console.log("Public Key:", this.state.publicKey);
      });
  }

  handleOnClickVote = async () => {
    if (this.state.candidateID === undefined) {
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
      this.setState({ loading: true });
      console.log("HE Public key:", this.state.publicKey.toString());
      console.time("encrypt");
      let vote = this.state.candidates.map(candidate => {
        if (candidate.Record.ID === this.state.candidateID) {
          var [cipher, rand] = this.state.publicKey.encrypt(1);
          this.state.verifyCandidates.push(rand);
          candidate.vote = cipher;
          return candidate;
        } else {
          [cipher, rand] = this.state.publicKey.encrypt(0);
          this.state.verifyCandidates.push(rand);
          candidate.vote = cipher;
          return candidate;
        }
      });
      console.timeEnd("encrypt");
      vote = {
        Vote: vote
      };
      //Verify vote first
      console.time("verify");
      axios
        .post("http://localhost:5000/verifyVote", vote)
        .then(response => {
          if (response.data !== false) {
            NotificationManager.success(
              "Your vote was success signed :-)",
              "SUCCESS!"
            );
            console.timeEnd("verify");
            const finalVote = response.data;
            finalVote.id = this.state.id;
            console.time("sendVote");
            //Then send signed vote
            axios
              .post("http://localhost:8000/voting-app/vote", finalVote)
              .then(response => {
                console.log("Final Vote:", finalVote);
                console.timeEnd("sendVote");
                if (response.data === true) {
                  /*this.setState({ isFinish: true });
                  this.state.isFinish = true;*/
                  NotificationManager.success(
                    "Your vote is counted :-)",
                    "SUCCESS!"
                  );
                  this.setState({ loading: false });
                } else {
                  NotificationManager.error(
                    "Your vote is not counted :-(",
                    "ERROR!"
                  );
                  this.setState({ loading: false });
                }
              });
          } else {
            NotificationManager.error(
              "Your vote is not sign from VS :-(",
              "ERROR!"
            );
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
          textAlign: "center",
          padding: "40px 0"
        },
        Cell: props => {
          return (
            <div className="radio align-middle">
              <input
                type="radio"
                name="optradio"
                onClick={() => {
                  this.state.vote = props.original.Record.Vote;
                  this.state.voteName = props.original.Record.Name;
                  this.state.candidateID = props.original.Record.ID;
                }}
              />
            </div>
          );
        },
        sortable: false,
        maxWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "ID",
        accessor: "Record.ID",
        style: {
          textAlign: "center",
          padding: "40px 0"
        },
        maxWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "Photo",
        style: {
          textAlign: "center"
        },
        Cell: props => {
          return (
            <div>
              <img
                src={props.original.Record.Foto}
                width="100"
                height="100"
                className="photos"
                alt=""
              />
            </div>
          );
        },
        sortable: false,
        maxWidth: 200,
        minWidth: 110,
        headerStyle: divStyle
      },
      {
        Header: "Name",
        accessor: "Record.Name",
        style: {
          textAlign: "center",
          padding: "40px 0"
        },
        headerStyle: divStyle
      },

      {
        Header: "Party",
        accessor: "Record.Description",
        style: {
          textAlign: "center",
          padding: "40px 0"
        },
        filterable: false,
        headerStyle: divStyle
      },
      {
        Header: "Age",
        accessor: "Record.Age",
        style: {
          textAlign: "center",
          padding: "45px 0"
        },
        maxWidth: 200,
        filterable: false,
        headerStyle: divStyle
      }
    ];

    return (
      <div className="myform">
        <Card
          title="Welcome in voting app."
          text="Choose one candidate and submit your vote."
        />
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
            <div className="button-group">
              <Button variant="success" onClick={this.handleOnClickVote}>
                Vote
              </Button>
              <Button
                variant="danger"
                onClick={() => this.props.history.push("/")}
              >
                Back
              </Button>
            </div>
          )}
          {this.state.isFinish && (
            <CSVLink
              data={
                this.state.id +
                "\n" +
                JSON.stringify(this.state.verifyCandidates)
              }
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
    );
  }
}

export default Candidates;
