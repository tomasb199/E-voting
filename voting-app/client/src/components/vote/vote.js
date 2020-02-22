import React, { Component } from "react";
import axios from "axios";

import PresidentTypeWithSign from "../candidates/presidentialType/presidentTypeWithSign";
import PresidentTypeWithoutSign from "../candidates/presidentialType/presidentTypeWithoutSign";

import ParliamentaryTypeWithSign from "../candidates/parliamentaryType/parliamentalyTypeWithSign";
import ParliamentaryTypeWithoutSign from "../candidates/parliamentaryType/parliamentalyTypeWithoutSign";

class Vote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSigningServerAvailable: Boolean,
      voteType: undefined
    };
  }

  componentDidMount() {
    //Is sining server online
    axios
      .post("http://localhost:8080/voting-app/hello", "test")
      .then(() => {
        this.setState({ isSigningServerAvailable: true });
        console.log("Signing server is available :)");
      })
      .catch(() => {
        this.setState({ isSigningServerAvailable: false });
        console.log("Signing server is not available :(");
      });

    //Get candidates
    axios.get("http://localhost:8000/voting-app/candidates/").then(voteData => {
      this.setState({ voteType: voteData.data.voteType });
      console.log("Voting type: ", voteData.data.voteType);
    });
  }

  render() {
    return (
      <div>
        {!this.state.isSigningServerAvailable && this.state.voteType === 1 && (
          <PresidentTypeWithoutSign />
        )}
        {this.state.isSigningServerAvailable && this.state.voteType === 1 && (
          <PresidentTypeWithSign />
        )}

        {!this.state.isSigningServerAvailable && this.state.voteType === 2 && (
          <ParliamentaryTypeWithoutSign />
        )}
        {this.state.isSigningServerAvailable && this.state.voteType === 2 && (
          <ParliamentaryTypeWithSign />
        )}
      </div>
    );
  }
}
export default Vote;
