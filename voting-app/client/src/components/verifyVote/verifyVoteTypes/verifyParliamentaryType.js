/* eslint-disable react/no-direct-mutation-state */
/*eslint-disable eqeqeq*/
import React, { Component } from "react";
import Card from "../../card/card";
import Button from "react-bootstrap/Button";
import FileReader from "../../fileReader/textFileReader";
import Dropdown from "react-dropdown";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import Spinner from "../../loading-spinner/loading-spinner";
import axios from "axios";

const paillier = require("../../lib/paillier-modul/index.js");
var bigInt = require("big-integer");

class VerifyParliamentaryType extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pubKey: [],
      candidates: [],
      id: undefined,
      candidatesID: [],
      random: [],
      Vote: undefined,
      currentVote: undefined,
      publicKey: undefined,
      voteType: undefined,
      selectedParty: undefined,
      inputData: {},
      loading: false,
    };
    this.verify = this.verify.bind();
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((voteData) => {
        this.setState({ voteData });
        this.setState({ candidates: voteData.candidate });
        this.setState({ voteType: voteData.voteType });
        this.setState({ maxVote: voteData.maxVote });
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

  handleForce = (data) => {
    console.log("Input data: ", JSON.parse(data));
    this.setState({ inputData: JSON.parse(data) });
    this.setState({ id: this.state.inputData.id });

    axios
      .get("http://localhost:8000/voting-app/getVote", {
        params: {
          ID: this.state.inputData.id,
        },
      })
      .then((response) => {
        this.setState({
          Vote: JSON.parse(JSON.stringify(response.data.candidate)),
        });
        console.log("Old vote: ", this.state.Vote);
        NotificationManager.success(
          "Your voting file was correct input :-)",
          "Success!"
        );
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  verify = async () => {
    if (this.state.id === undefined || this.state.random === undefined) {
      NotificationManager.error("Enter your voting file.", "WARNING!");
      return;
    } else if (this.state.selectedParty === undefined) {
      NotificationManager.error("Choose one candidate!", "Your vote is empty");
      return;
    } else {
      this.setState({ loading: true });
      setTimeout(() => {
        console.log("Selected party: ", this.state.selectedParty);
        const preferentialVote = this.state.candidatesID
          .map((e, i) => (e === true ? i : ""))
          .filter(Boolean);
        console.log("Selected candidates: ", preferentialVote);

        console.time("verifyTime");

        let isValid = true;
        let newCipher;
        this.state.candidates.forEach((item, i) => {
          if (isValid) {
            //this random
            const r = bigInt(this.state.inputData.candidates.candidate[i].rand);
            const currentVote =
              item.ID === this.state.selectedParty.value
                ? bigInt(1)
                : bigInt(0);
            [newCipher] = this.state.publicKey.encrypt(currentVote, r);
            //is equal like original
            if (!newCipher.eq(this.state.Vote[i].vote)) {
              isValid = false;
            }
          }
          if (isValid) {
            item.Candidates.forEach((candidatesInParty, y) => {
              //this random preferential vote
              const r = bigInt(
                this.state.inputData.candidates.candidate[i].Candidates[y].rand
              );
              //current preferential vote
              let currentVote;
              if (item.ID === this.state.selectedParty.value) {
                currentVote = preferentialVote.includes(candidatesInParty.ID)
                  ? bigInt(1)
                  : bigInt(0);
              } else {
                currentVote = bigInt(0);
              }
              [newCipher] = this.state.publicKey.encrypt(currentVote, r);
              //is equal like original
              if (!newCipher.eq(this.state.Vote[i].Candidates[y].vote)) {
                isValid = false;
              }
            });
          }
        });
        setTimeout(() => {
          this.setState({ loading: false });
        }, 0);
        console.timeEnd("verifyTime");
        if (isValid) {
          NotificationManager.success(
            "Your vote is counted and is same as current :-)",
            "SUCCESS!"
          );
        } else {
          NotificationManager.error(
            "Your vote is not same as current :-(",
            "ERROR!"
          );
          //Reset selected candidates array
          this.state.selectedPartyCandidates.forEach((candidate, i) => {
            this.state.candidatesID[i + 1] = false;
          });
        }
      }, 0);
    }
  };

  selectParty = (input) => {
    const selectedParty = this.state.candidates.find(
      (item) => item.ID == input.value
    );
    this.setState({ selectedPartyCandidates: selectedParty.Candidates });
    //Reset selected candidates array
    selectedParty.Candidates.forEach((candidate, i) => {
      this.state.candidatesID[i + 1] = false;
    });
    this.setState({ selectedParty: input });
    this.setState({ selectedPartyValue: input.value });
  };

  render() {
    const divStyle = {
      fontWeight: "bold",
    };

    const styleCenter = {
      textAlign: "center",
    };

    const columns = [
      {
        Header: "Vote",
        style: styleCenter,
        Cell: (props) => {
          return (
            <div className='radio align-middle'>
              <input
                type='checkbox'
                name='optradio'
                onClick={() => {
                  this.state.candidatesID[Number(props.original.ID)] = !this
                    .state.candidatesID[Number(props.original.ID)];

                  if (
                    this.state.candidatesID.filter((x) => x === true).length >
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
        headerStyle: divStyle,
      },
      {
        Header: "ID",
        accessor: "ID",
        style: styleCenter,
        maxWidth: 75,
        headerStyle: divStyle,
      },
      {
        Header: "Name",
        accessor: "Name",
        style: styleCenter,
        headerStyle: divStyle,
      },
    ];

    var Party = this.state.candidates.map((candidate) => {
      return { value: candidate.ID, label: candidate.Party };
    });

    return (
      <div>
        <Card
          title='Verify your vote.'
          text={`Choose 1 party, then choose ${this.state.maxVote} preferential votes and submit your vote.`}
        />
        <div className='sweet-loading'>
          <div>
            <br />
            <FileReader onFileLoaded={this.handleForce} />
            <br />
            <div className='form-inline'>
              <b className='font-weight-bold'>Select party</b>
              <Dropdown
                options={Party}
                onChange={this.selectParty}
                value={this.state.selectedPartyValue}
                placeholder='Select a party'
              />
            </div>
            <br />
            {this.state.selectedParty !== undefined && (
              <div>
                <br />
                <b className='font-weight-bold'>Select candidates</b>
                <ReactTable
                  className='-striped -highlight'
                  showPagination={false}
                  minRows={1}
                  columns={columns}
                  data={this.state.selectedPartyCandidates}
                ></ReactTable>
              </div>
            )}
            <br />
            <div className='button-group'>
              <Button
                variant='success'
                className='success'
                onClick={this.verify}
              >
                Verify
              </Button>
              <Button
                variant='danger'
                onClick={() => this.props.history.push("/")}
              >
                Back
              </Button>
            </div>
            <br />
            <Spinner show={this.state.loading} />
            <NotificationContainer />
          </div>
        </div>
      </div>
    );
  }
}
export default VerifyParliamentaryType;
