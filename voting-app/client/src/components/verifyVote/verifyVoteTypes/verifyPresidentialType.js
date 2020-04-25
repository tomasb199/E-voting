/* eslint-disable react/no-direct-mutation-state */
/*eslint-disable eqeqeq*/
import React, { Component } from "react";
import Card from "../../card/card";
import Button from "react-bootstrap/Button";
import FileReader from "../../fileReader/fileReader";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import axios from "axios";

const paillier = require("paillier-js");
var bigInt = require("big-integer");

class VerifyPresidentialType extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pubKey: [],
      candidates: [],
      id: undefined,
      random: [],
      Vote: undefined,
      currentVote: undefined,
      publicKey: undefined,
      voteType: undefined,
    };
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((voteData) => {
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
    if (this.state.voteType === 1) {
      if (
        !isNaN(data[0][0]) &&
        data[1].length === this.state.candidates.length
      ) {
        this.setState({ id: data[0][0] });
        this.setState({ random: data[1] });
        axios
          .get("http://localhost:8000/voting-app/getVote", {
            params: {
              ID: this.state.id,
            },
          })
          .then((response) => {
            this.setState({ Vote: response.data.candidate });
            console.log("Vote:" + this.state.Vote);
            NotificationManager.success(
              "Your voting file was correct input :-)",
              "Success!"
            );
          })
          .catch(function (error) {
            console.log(error);
          })
          .then(function () {
            // always executed
          });
      }
    } else if (this.state.voteType === 2) {
    }
  };

  verify = async () => {
    if (this.state.id === undefined || this.state.random === undefined) {
      NotificationManager.error("Enter your voting file.", "WARNING!");
      return;
    } else if (this.state.Vote === undefined) {
      NotificationManager.error("Choose one candidate!", "Your vote is empty");
      return;
    } else {
      const g = this.state.publicKey.g;
      const n = this.state.publicKey.n;
      const _n2 = this.state.publicKey._n2;

      console.time("time");
      let isValid = true;
      this.state.candidates.forEach((item, i) => {
        //this random
        const r = bigInt(this.state.random[i]);
        //current vote
        const currentVote =
          this.state.candidateID == item.ID ? bigInt(1) : bigInt(0);
        const newCipher = g
          .modPow(currentVote, _n2)
          .multiply(r.modPow(n, _n2))
          .mod(_n2);
        if (!newCipher.eq(this.state.Vote[i].vote)) {
          isValid = false;
        }
      });
      console.timeEnd("time");
      if (isValid) {
        NotificationManager.success(
          "Your vote is counted and is same as current :-)",
          "SUCCESS!"
        );
      } else {
        NotificationManager.error(
          "Your vote is not same as current :-(",
          "SUCCESS!"
        );
      }
    }
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
      <div>
        {this.state.voteType === 1 && (
          <Card
            title='Verify your vote.'
            text={`Choose 1 candidate and submit your vote.`}
          />
        )}
        {this.state.voteType === 2 && (
          <Card
            title='Verify your vote.'
            text={`Choose 1 party, then choose ${this.state.voteData.maxVote} preferential votes and submit your vote.`}
          />
        )}
        <div className='sweet-loading'>
          {this.state.voteType === 1 && (
            <div>
              <br />
              <FileReader onFileLoaded={this.handleForce} />
              <br />
              <ReactTable
                className='-striped -highlight'
                showPagination={false}
                minRows={1}
                columns={columns}
                data={this.state.candidates}
              ></ReactTable>
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
              <NotificationContainer />
            </div>
          )}
        </div>
      </div>
    );
  }
}
export default VerifyPresidentialType;
