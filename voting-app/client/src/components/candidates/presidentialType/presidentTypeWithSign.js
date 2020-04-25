/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable no-loop-func */
import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { confirm } from "../../confirmation/confirmation";
import axios from "axios";
import "react-table/react-table.css";
import "react-notifications/lib/notifications.css";
import "react-dropdown/style.css";

import Spinner from "../../loading-spinner/loading-spinner";
import Card from "../../card/card";
import "../candidates.css";

import { properties } from "../properties.js";

const paillier = require("paillier-js");
var bigInt = require("big-integer");

class Candidates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voteData: undefined,
      candidates: [],
      verifyCandidates: [],
      voteName: undefined,
      isFinish: false,
      candidateID: undefined,
      isDowloaded: false,
      publicKey: undefined,
      loading: false,
    };
    this.handleOnClickVote = this.handleOnClickVote.bind(this);
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((voteData) => {
        this.setState({ voteData });
        this.setState({ candidates: voteData.candidate });
        this.setState({ voteType: voteData.voteType });
        console.log("Vote data: ", this.state.voteData);
        console.log("Candidates: ", this.state.candidates);
      });

    axios
      .get("http://localhost:8000/voting-app/getPubKey/")
      .then((response) => response.data)
      .then((pubKey) => {
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
    confirm(
      "Are you sure vote - " + this.state.voteName + "?",
      "OK",
      "Back",
      "Confimation your vote"
    ).then(() => {
      console.log("HE Public key:", this.state.publicKey.toString());
      console.time("encrypt");
      this.setState({ loading: true });
      var vote = this.state.voteData.candidate.map((candidate) => {
        var [cipher, rand] =
          candidate.ID === this.state.candidateID
            ? this.state.publicKey.encrypt(1)
            : this.state.publicKey.encrypt(0);
        this.state.verifyCandidates.push(rand);
        candidate.vote = cipher;
        return candidate;
      });
      console.log("rand: ", this.state.verifyCandidates);
      console.timeEnd("encrypt");
      var voteData = this.state.voteData;
      voteData.candidate = vote;
      console.log("Data to sign: ", voteData);
      //Verify vote first
      console.time("verify");
      axios
        .post("http://localhost:5000/verifyVote", voteData)
        .then((response) => {
          if (response.data !== false) {
            NotificationManager.success(
              "Your vote was success signed :-)",
              "SUCCESS!"
            );
            console.timeEnd("verify");
            const finalVote = response.data;
            console.log("Finale Vote: ", finalVote);
            console.time("sendVote");
            //Then send signed vote
            axios
              .post("http://localhost:8080/voting-app/sendVote", finalVote)
              .then((response) => {
                localStorage.setItem(
                  "votingData",
                  JSON.stringify(this.state.verifyCandidates)
                );
                this.setState({ loading: false });
                console.log("Result:", response.data);
                window.location.href = response.data;
              });
          } else {
            NotificationManager.error(
              "Your vote is not sign from VS :-(",
              "ERROR!"
            );
            this.setState({ loading: false });
          }
        })
        .catch((error) => {
          console.log(error);
          NotificationManager.error("Faild :-(", "ERROR!");
          this.setState({ loading: false });
        });
    });
  };

  render() {
    const divStyle = {
      fontWeight: "bold",
    };

    const styleHeader = {
      textAlign: "center",
      padding: "40px 0",
    };

    const columns = [
      {
        Header: "Vote",
        style: styleHeader,
        Cell: (props) => {
          return (
            <div className='radio align-middle'>
              <input
                type='radio'
                name='optradio'
                onClick={() => {
                  this.state.voteName = props.original.Name;
                  this.state.candidateID = props.original.ID;
                }}
              />
            </div>
          );
        },
        sortable: false,
        maxWidth: 75,
        headerStyle: divStyle,
      },
      {
        Header: "ID",
        accessor: "ID",
        style: styleHeader,
        maxWidth: 75,
        headerStyle: divStyle,
      },
      {
        Header: "Photo",
        style: {
          textAlign: "center",
        },
        Cell: (props) => {
          return (
            <div>
              <img
                src={props.original.Foto}
                width='100'
                height='100'
                className='photos'
                alt=''
              />
            </div>
          );
        },
        sortable: false,
        maxWidth: 200,
        minWidth: 110,
        headerStyle: divStyle,
      },
      {
        Header: "Name",
        accessor: "Name",
        style: styleHeader,
        headerStyle: divStyle,
      },

      {
        Header: "Party",
        accessor: "Description",
        style: styleHeader,
        filterable: false,
        headerStyle: divStyle,
      },
      {
        Header: "Age",
        accessor: "Age",
        style: {
          textAlign: "center",
          padding: "45px 0",
        },
        maxWidth: 200,
        filterable: false,
        headerStyle: divStyle,
      },
    ];

    return (
      <div className='myform'>
        <Card
          title={properties.cardTitleText}
          text={properties.presidentTypeText}
        />
        <div className='sweet-loading'>
          <br />
          <ReactTable
            className='-striped -highlight'
            showPagination={false}
            minRows={1}
            columns={columns}
            data={this.state.candidates}
          ></ReactTable>
          <br />
          {!this.state.isFinish && (
            <div className='button-group'>
              <Button variant='success' onClick={this.handleOnClickVote}>
                Vote
              </Button>
              <Button
                variant='danger'
                onClick={() => this.props.history.push("/")}
              >
                Back
              </Button>
            </div>
          )}
          <Spinner show={this.state.loading} />
          <NotificationContainer />
        </div>
      </div>
    );
  }
}

export default Candidates;
