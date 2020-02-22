import React, { Component } from "react";
import { confirm } from "../confirmation/confirmation";
import queryString from "query-string";
import { CSVLink } from "react-csv";
import Button from "react-bootstrap/Button";
import { Redirect } from "react-router-dom";
import Spinner from "../loading-spinner/loading-spinner";
import axios from "axios";
import "./candidates.css";

class AfterSign extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voteType: undefined,
      isVoteSuccess: false,
      isDowloaded: false,
      verifyCandidates: {},
      id: undefined,
      isDownloadComplete: false
    };
  }

  componentDidMount() {
    const parameters = queryString.parse(this.props.location.search);
    const afterSignedRequestParams = {
      sessionId: parameters.sessionId,
      documentId: parameters.documentId
    };
    console.log(afterSignedRequestParams);
    const votingData = JSON.parse(localStorage.getItem("votingData"));
    console.log("Tu:", votingData);
    this.setState({
      verifyCandidates: JSON.parse(localStorage.getItem("votingData"))
    });

    if (votingData.voteType == 2) {
      this.setState({ voteType: 2 });
    } else {
      this.setState({ voteType: 1 });
    }

    console.log("voteType", votingData.voteType);

    //localStorage.clear();
    axios
      .post(
        "http://localhost:8080/voting-app/afterSign",
        afterSignedRequestParams
      )
      .then(response => {
        this.setState({ loading: false });
        console.log("Result:", response.data);
        if (response.data != false) {
          this.setState({ isVoteSuccess: true });
          this.setState({ id: response.data });
          this.setState({ isDownloadComplete: true });
        } else {
          this.setState({ isVoteSuccess: false });
        }
      })
      .catch(error => console.error);
  }

  handleDownload = () => {
    confirm("Are you want verify your vote?", "OK", "Back", "Vote verify").then(
      () => {
        this.setState({ isDowloaded: true });
        //this.props.history.push("/");
      }
    );
  };

  downloadTxtFile = () => {
    const element = document.createElement("a");
    const finalRandom = {
      candidates: this.state.verifyCandidates,
      id: this.state.id
    };
    const file = new Blob([JSON.stringify(finalRandom).replace("\n", "")], {
      type: "text/plain"
    });
    element.href = URL.createObjectURL(file);
    element.download = "voting_file_for_verify.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    confirm("Are you want verify your vote?", "OK", "Back", "Vote verify").then(
      () => {
        this.setState({ isDowloaded: true });
      }
    );
  };

  render() {
    return (
      <div>
        {this.state.isDownloadComplete && (
          <div id='center' className='container afterSignContainer'>
            <div className='row justify-content-md-center'>
              <div className='col-md-auto'>
                <img
                  height='150'
                  width='150'
                  src={require("./images/Successful-Check4.png")}
                />
                <br />
                <br />
              </div>
            </div>
            <div className='row justify-content-md-center'>
              <div className='col-md-auto'>
                <div className='alert alert-success' role='alert'>
                  Your vote was successfully sended :)
                </div>
              </div>
            </div>
            <div className='row justify-content-md-center'>
              <div className='col-md-auto'>
                {this.state.voteType === 1 && (
                  <CSVLink
                    data={this.state.id + "\n" + this.state.verifyCandidates}
                    filename={"my-vote-verification-data.csv"}
                    className='btn btn-info'
                    target='_blank'
                    onClick={this.handleDownload}
                  >
                    Download
                  </CSVLink>
                )}
                {this.state.voteType === 2 && (
                  <Button variant='info' onClick={this.downloadTxtFile}>
                    Download
                  </Button>
                )}
              </div>
            </div>
            <div className='row justify-content-md-center'>
              <div className='col-md-auto'>
                <small className='font-weight-bold textColor'>
                  *Link for download voting key for verification your vote.
                </small>
              </div>
            </div>
            {this.state.isDowloaded && (
              <Redirect
                to={{
                  pathname: "/verify"
                }}
              />
            )}
          </div>
        )}
        <Spinner show={!this.state.isDownloadComplete} />
      </div>
    );
  }
}

export default AfterSign;
