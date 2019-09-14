import React, { Component } from "react";
import GoogleLogin from "react-google-login";
import axios from "axios";
import auth from "../../authentication/auth";

class Login extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      clientId: null
    };
  }
  async componentDidMount() {
    const clientIdMesage = await axios.get("/voting-app/getClientID");
    this.setState({ clientId: clientIdMesage.data.clientID });
  }

  onFailure = error => {
    console.log("Chyba", error);
    alert(error);
  };

  googleResponse = async response => {
    console.log(response.accessToken);
    const res = await axios.post("/voting-app/login", {
      access_token: response.accessToken
    });
    console.log("res", res);
    axios.defaults.headers.common["authorization"] = res.data.token;

    //If I want to remember the token after closing the card or browser
    /*localStorage.setItem("JWT_TOKEN", res.data.token);
    console.log(localStorage.getItem("JWT_TOKEN"));*/

    this.setState({ token: res.data.token });
    auth.login(() => {
      this.props.history.push("/");
    });
  };

  render() {
    return (
      <div>
        <div id="centerScreen">
          <GoogleLogin
            clientId={
              "661308124983-sqh9kd1fu3n72lej70l8rk24fml30e8q.apps.googleusercontent.com"
            }
            buttonText="Login"
            onSuccess={this.googleResponse}
            onFailure={this.onFailure}
            style={{
              margin: "auto",
              width: "50%",
              padding: "10px"
            }}
          />
        </div>
      </div>
    );
  }
}

export default Login;
