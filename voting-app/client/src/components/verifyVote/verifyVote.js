import React, { Component } from "react";
import axios from "axios";

import VerifyPresidentialType from "./verifyVoteTypes/verifyPresidentialType";
import VerifyParliamentaryType from "./verifyVoteTypes/verifyParliamentaryType";

class VerifyVote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voteType: undefined
    };
  }

  componentDidMount() {
    //Get candidates
    axios.get("http://localhost:8000/voting-app/candidates/").then(voteData => {
      this.setState({ voteType: voteData.data.voteType });
      console.log("Voting type: ", voteData.data.voteType);
    });
  }

  render() {
    return (
      <div>
        {this.state.voteType === 1 && <VerifyPresidentialType />}
        {this.state.voteType === 2 && <VerifyParliamentaryType />}
      </div>
    );
  }
}
export default VerifyVote;
