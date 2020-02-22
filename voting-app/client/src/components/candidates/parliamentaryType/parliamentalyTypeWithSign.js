/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable no-loop-func */
/*eslint-disable eqeqeq*/
import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager
} from "react-notifications";
import { confirm } from "../../confirmation/confirmation";
import axios from "axios";
import "react-table/react-table.css";
import "react-notifications/lib/notifications.css";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";

import Spinner from "../../loading-spinner/loading-spinner";
import Card from "../../card/card";
import "../candidates.css";

import { properties } from "../properties";

const paillier = require("paillier-js");
var bigInt = require("big-integer");

class Candidates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voteData: undefined,
      candidates: [],
      maxVote: undefined,
      verifyCandidates: [],
      candidatesID: [],
      selectedParty: undefined,
      selectedPartyCandidates: [],
      selectedPartyValue: "Select a party",
      publicKey: undefined,
      loading: false
    };
    this.handleOnClickVote = this.handleOnClickVote.bind(this);
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then(response => response.data)
      .then(voteData => {
        this.setState({ voteData });
        this.setState({ candidates: voteData.candidate });
        this.setState({ voteType: voteData.voteType });
        this.setState({ maxVote: voteData.maxVote });
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
        let randCandidates = {
          candidate: [],
          voteType: this.state.voteData.voteType,
          maxVote: this.state.maxVote
        };
        let candidate = this.state.candidates.map((candidate, index) => {
          if (candidate.ID === partyVote) {
            var [cipher, rand] = publicKey.encrypt(1);
            const party = {
              ID: candidate.ID,
              Party: candidate.Party,
              rand,
              Candidates: []
            };
            randCandidates.candidate.push(party);
            candidate.vote = cipher;
            return candidate;
          } else {
            [cipher, rand] = publicKey.encrypt(0);
            const party = {
              ID: candidate.ID,
              Party: candidate.Party,
              rand,
              Candidates: []
            };
            randCandidates.candidate.push(party);
            candidate.vote = cipher;
            return candidate;
          }
        });
        for (let i = 0; i < candidate.length; i++) {
          const id = candidate[i].ID;
          candidate[i].Candidates = candidate[i].Candidates.map(candidate => {
            if (id === partyVote && preferentialVote.includes(candidate.ID)) {
              var [cipher, rand] = publicKey.encrypt(1);
              const PreferentialVotesRand = {
                ID: candidate.ID,
                Name: candidate.Name,
                rand
              };
              randCandidates.candidate[i].Candidates.push(
                PreferentialVotesRand
              );
              candidate.vote = cipher;
              return candidate;
            } else {
              [cipher, rand] = publicKey.encrypt(0);
              const PreferentialVotesRand = {
                ID: candidate.ID,
                Name: candidate.Name,
                rand
              };
              randCandidates.candidate[i].Candidates.push(
                PreferentialVotesRand
              );
              candidate.vote = cipher;
              return candidate;
            }
          });
        }
        console.log("tu:", randCandidates);
        this.setState({ verifyCandidates: randCandidates });
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
                .post("http://localhost:8080/voting-app/sendVote", finalVote)
                .then(response => {
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
          .catch(error => {
            console.log(error);
            NotificationManager.error("Faild :-(", "ERROR!");
            this.setState({ loading: false });
          });
      }, 0);
    });
  };

  selectParty = input => {
    const selectedParty = this.state.candidates.find(
      item => item.ID == input.value
    );
    this.setState({ selectedPartyCandidates: selectedParty.Candidates });

    //Set selected candidates array
    selectedParty.Candidates.forEach((candidate, i) => {
      this.state.candidatesID[i + 1] = false;
    });
    this.setState({ selectedParty: input });
    this.setState({ selectedPartyValue: input.value });
  };

  render() {
    const divStyle = {
      fontWeight: "bold"
    };

    const styleCenter = {
      textAlign: "center"
    };

    const columns = [
      {
        Header: "Vote",
        style: styleCenter,
        Cell: props => {
          return (
            <div className='radio align-middle'>
              <input
                type='checkbox'
                name='optradio'
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
        style: styleCenter,
        maxWidth: 75,
        headerStyle: divStyle
      },
      {
        Header: "Name",
        accessor: "Name",
        style: styleCenter,
        headerStyle: divStyle
      }
    ];

    var Party = this.state.candidates.map(candidate => {
      return { value: candidate.ID, label: candidate.Party };
    });

    return (
      <div className='myform'>
        <Card
          title={properties.cardTitleText}
          text={properties.parlamentTypeText.replace(
            "{maxVote}",
            this.state.maxVote
          )}
        />
        <br />
        <div className='sweet-loading'>
          <div className='form-inline'>
            <b className='font-weight-bold'>Select party</b>
            <Dropdown
              options={Party}
              onChange={this.selectParty}
              value={this.state.selectedPartyValue}
              placeholder='Select a party'
            />
          </div>
          {this.state.selectedParty !== undefined && (
            <div>
              <br />
              <b className='font-weight-bold'>Select candidates</b>
              <ReactTable
                className='-striped -highlight'
                defaultPageSize={150}
                minRows={1}
                columns={columns}
                data={this.state.selectedPartyCandidates}
              ></ReactTable>
            </div>
          )}
          <br />
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
          <Spinner show={this.state.loading} />
          <NotificationContainer />
        </div>
      </div>
    );
  }
}

export default Candidates;
