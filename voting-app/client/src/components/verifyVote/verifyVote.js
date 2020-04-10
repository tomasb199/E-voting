/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from "react";
import Card from "../card/card";
import Button from "react-bootstrap/Button";
import FileReader from "../fileReader/fileReader";
import ReactTable from "react-table";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import axios from "axios";

var bigInt = require("big-integer");

class VerifyVote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pubKey: [],
      candidates: [],
      id: undefined,
      random: undefined,
      Vote: undefined,
      currentVote: undefined,
      publicKey: undefined,
    };
  }

  componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((candidates) => {
        this.setState({ candidates });
        console.log("Candidates:", this.state.candidates);
        this.state.validScores = candidates.map(function (obj) {
          return obj.Record.Vote;
        });
        console.log("Valid scores: ", this.state.validScores);
      });

    axios
      .get("http://localhost:8000/voting-app/getPubKey/")
      .then((response) => response.data)
      .then((pubKey) => {
        this.setState({ pubKey });
        console.log("Public Key:", this.state.pubKey);
      });
  }

  handleForce = (data) => {
    if (!isNaN(data[0][0]) && !isNaN(data[1][0])) {
      this.state.id = data[0][0];
      this.state.random = data[1][0];
      console.log(data[0][0]);
      console.log(data[1][0]);
      axios
        .get("http://localhost:8000/voting-app/getVote", {
          params: {
            ID: this.state.id,
          },
        })
        .then((response) => {
          this.setState({ Vote: response.data.Vote });
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
    } else {
      NotificationManager.error(
        "Your voting file is not correct :-(",
        "ERROR!"
      );
      return;
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
      const g = bigInt(this.state.pubKey.g);
      const r = bigInt(this.state.random);
      const newCipher = g
        .modPow(bigInt(this.state.currentVote.Vote), this.state.pubKey._n2)
        .multiply(r.modPow(this.state.pubKey.n, this.state.pubKey._n2))
        .mod(this.state.pubKey._n2);
      if (newCipher.eq(this.state.Vote.toString())) {
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

    const columns = [
      {
        Header: "Vote",
        style: {
          textAlign: "center",
          padding: "40px 0",
        },
        Cell: (props) => {
          return (
            <div className='radio'>
              <label>
                <input
                  type='radio'
                  name='optradio'
                  onClick={() => {
                    this.state.currentVote = props.original.Record;
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
        headerStyle: divStyle,
      },
      {
        Header: "ID",
        accessor: "Record.ID",
        style: {
          textAlign: "center",
          padding: "40px 0",
        },
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
                src={props.original.Record.Foto}
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
        accessor: "Record.Name",
        style: {
          textAlign: "center",
          padding: "40px 0",
        },
        headerStyle: divStyle,
      },

      {
        Header: "Party",
        accessor: "Record.Description",
        style: {
          textAlign: "center",
          padding: "40px 0",
        },
        filterable: false,
        headerStyle: divStyle,
      },
      {
        Header: "Age",
        accessor: "Record.Age",
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
          title='Verify your vote.'
          text='Enter your voting file and choose your candidate.'
        />
        <br />
        <FileReader onFileLoaded={this.handleForce} />
        <br />
        <ReactTable
          className='-striped -highlight'
          showPagination={false}
          minRows={1}
          columns={columns}
          data={this.state.candidates}
        />
        <br />
        <div className='button-group'>
          <Button variant='success' className='success' onClick={this.verify}>
            Verify
          </Button>
          <Button variant='danger' onClick={() => this.props.history.push("/")}>
            Back
          </Button>
        </div>
        <NotificationContainer />
      </div>
    );
  }
}
export default VerifyVote;
