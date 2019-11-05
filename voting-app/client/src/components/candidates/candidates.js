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
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";

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
      text:
        "Choose 1 party, then choose 3 preferential votes and submit your vote.",
      voteData: undefined,
      candidates: [],
      voteType: undefined,
      verifyCandidates: [],
      voteName: undefined,
      candidatesName: [],
      candidatesID: [],
      Party: undefined,
      selectedParty: undefined,
      selectedPartyValue: "Select a party",
      isFinish: false,
      id: undefined,
      candidateID: undefined,
      isDowloaded: false,
      publicKey: undefined,
      loading: false,
      selectedManyCandidates: false
    };
    this.handleOnClickVote = this.handleOnClickVote.bind(this);
    this.output = this.output.bind(this);
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then(response => response.data)
      .then(voteData => {
        this.setState({ voteData });
        this.setState({ candidates: voteData.candidate });
        this.setState({ voteType: voteData.voteType });
        if (voteData.voteType === 2) {
          //Init checkbox group model
          voteData.candidate[0].Candidates.forEach((candidate, i) => {
            this.state.candidatesID[i + 1] = false;
          });
        }
        console.log("Vote data: ", this.state.voteData);
        console.log("Candidates: ", this.state.candidates);
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
    if (this.state.voteType === 1) {
      if (this.state.candidateID === undefined) {
        NotificationManager.error(
          "Choose one candidate!",
          "Your vote is empty"
        );
        return;
      }

      if (this.state.id === undefined) {
        NotificationManager.error("Enter your ID!", "Your ID is empty");
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
        var vote = this.state.voteData.candidate.map(candidate => {
          if (candidate.ID === this.state.candidateID) {
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
        var voteData = this.state.voteData;
        voteData.candidate = vote;
        console.log("Data to sign: ", voteData);
        //Verify vote first
        console.time("verify");
        axios
          .post("http://localhost:5000/verifyVote", voteData)
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
    } else if (this.state.voteType === 2) {
      if (
        this.state.candidatesID.filter(x => x === true).length >
        this.state.voteData.maxVote
      ) {
        NotificationManager.error("To many selected candidates!", "ERROR!");
        return;
      }

      if (this.state.selectedParty === undefined) {
        NotificationManager.error("Please, select party!", "ERROR!");
        return;
      }

      if (this.state.id === undefined) {
        NotificationManager.error("Enter your ID!", "Your ID is empty");
        return;
      }
      confirm(
        "Are you sure vote - " + this.state.selectedParty.label + "?",
        "OK",
        "Back",
        "Confimation your vote"
      ).then(() => {
        this.setState({ loading: true });
        setTimeout(() => {
          const partyVote = this.state.selectedPartyValue;
          console.log("Party Vote: ", partyVote);
          const preferentialVote = this.state.candidatesID
            .map((e, i) => (e === true ? i : ""))
            .filter(Boolean);
          console.log("Preferential Votes: ", preferentialVote);
          const publicKey = this.state.publicKey;
          console.log("HE Public key:", publicKey);
          console.time("encrypt");
          let candidate = this.state.candidates.map(candidate => {
            if (candidate.ID === partyVote) {
              var [cipher, rand] = publicKey.encrypt(1);
              candidate.vote = cipher;
              return candidate;
            } else {
              [cipher, rand] = publicKey.encrypt(0);
              candidate.vote = cipher;
              return candidate;
            }
          });
          for (let i = 0; i < candidate.length; i++) {
            const id = candidate[i].ID;
            candidate[i].Candidates = candidate[i].Candidates.map(candidate => {
              if (id === partyVote && preferentialVote.includes(candidate.ID)) {
                var [cipher, rand] = publicKey.encrypt(1);
                candidate.vote = cipher;
                return candidate;
              } else {
                [cipher, rand] = publicKey.encrypt(0);
                candidate.vote = cipher;
                return candidate;
              }
            });
          }

          var voteData = this.state.voteData;
          voteData.candidate = candidate;
          console.timeEnd("encrypt");
          console.log("Data to sign: ", voteData);
          //Verify vote first
          console.time("verify");
          axios
            .post("http://localhost:5000/verifyVote", voteData)
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
        }, 0);
      });
    }
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

  selectParty = input => {
    //Reset selected candidates array
    this.state.candidates[0].Candidates.forEach((candidate, i) => {
      this.state.candidatesID[i + 1] = false;
    });

    this.setState({ selectedParty: input });
    this.setState({ selectedPartyValue: input.value });
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
                  this.state.voteName = props.original.Name;
                  this.state.candidateID = props.original.ID;
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
        accessor: "ID",
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
                src={props.original.Foto}
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
        accessor: "Name",
        style: {
          textAlign: "center",
          padding: "40px 0"
        },
        headerStyle: divStyle
      },

      {
        Header: "Party",
        accessor: "Description",
        style: {
          textAlign: "center",
          padding: "40px 0"
        },
        filterable: false,
        headerStyle: divStyle
      },
      {
        Header: "Age",
        accessor: "Age",
        style: {
          textAlign: "center",
          padding: "45px 0"
        },
        maxWidth: 200,
        filterable: false,
        headerStyle: divStyle
      }
    ];

    const columns2 = [
      {
        Header: "Vote",
        style: {
          textAlign: "center"
          //padding: "40px 0"
        },
        Cell: props => {
          return (
            <div className="radio align-middle">
              <input
                type="checkbox"
                name="optradio"
                onClick={() => {
                  this.state.candidatesID[Number(props.original.ID)] = !this
                    .state.candidatesID[Number(props.original.ID)];

                  if (
                    this.state.candidatesID.filter(x => x === true).length >
                    this.state.voteData.maxVote
                  ) {
                    NotificationManager.error(
                      "To many selected candidates!",
                      "ERROR!"
                    );
                  }
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
        accessor: "ID",
        style: {
          textAlign: "center"
          //padding: "40px 0"
        },
        maxWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "Name",
        accessor: "Name",
        style: {
          textAlign: "center"
          //padding: "40px 0"
        },
        headerStyle: divStyle
      }
    ];

    //Create array of political parties
    if (this.state.voteType === 2) {
      var Party = this.state.candidates.map(candidate => {
        return { value: candidate.ID, label: candidate.Party };
      });
    }

    return (
      <div className="myform">
        {this.state.voteType === 1 && (
          <Card
            title="Welcome in voting app."
            text={`Choose 1 candidate and submit your vote.`}
          />
        )}
        {this.state.voteType === 2 && (
          <Card 
          title="Welcome in voting app."
          text={`Choose 1 party, then choose ${this.state.voteData.maxVote} preferential votes and submit your vote.`} />
        )}
        <div className="sweet-loading">
          <InputID output={this.output} />
          {this.state.voteType === 1 && (
            <ReactTable
              className="-striped -highlight"
              defaultPageSize={5}
              minRows={1}
              columns={columns}
              data={this.state.candidates}
            ></ReactTable>
          )}
          {this.state.voteType === 2 && (
            <div className="form-inline">
              <b className="font-weight-bold">Select party</b>
                <Dropdown
                  options={Party}
                  onChange={this.selectParty}
                  value={this.state.selectedPartyValue}
                  placeholder="Select a party"
                />
            </div>
          )}
          {this.state.selectedParty !== undefined && (
            <div>
              <br />
              <b className="font-weight-bold">Select candidates</b>
              <ReactTable
                className="-striped -highlight"
                defaultPageSize={150}
                minRows={1}
                columns={columns2}
                data={this.state.candidates[0].Candidates}
              ></ReactTable>
            </div>
          )}
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
