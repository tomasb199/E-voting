import React, {Component} from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import { Redirect } from 'react-router-dom';

class Login extends Component {

  constructor() {
    super();
    this.state = { 
      isAuthenticated: false,
      user: null,
      clientId: null,
      };
  }
  async componentDidMount() {
    const clientIdMesage = await axios.get('/voting-app/getClientID');
    this.setState({ clientId: clientIdMesage.data.clientID});
  }

logout = () => {
  this.setState({isAuthenticated: false, token: ''})
};

onFailure = (error) => {
  console.log(error);
  alert(error);
};

googleResponse = async (response) => {
  console.log(response.accessToken);
  const res = await axios.post('/voting-app/login', {
    access_token: response.accessToken
  });
  console.log('res', res);
  axios.defaults.headers.common['authorization'] = res.data.token;

  //If I want to remember the token after closing the card or browser
  /*localStorage.setItem('JWT_TOKEN', res.data.token);
  console.log(localStorage.getItem('JWT_TOKEN'));*/

  this.setState({isAuthenticated: true, token: res.data.token});
};

render() {

    return (
        <div>
            <div>
                <GoogleLogin
                    clientId={"661308124983-sqh9kd1fu3n72lej70l8rk24fml30e8q.apps.googleusercontent.com"}
                    buttonText="Login"
                    onSuccess={this.googleResponse}
                    onFailure={this.onFailure}
                />
            </div>
            {this.state.isAuthenticated &&
                    <Redirect
                    to={{
                        pathname: "/"
                    }}
                    />
                }
        </div>
    );
}
}

export default Login;