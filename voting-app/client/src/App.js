import React from 'react';
import './App.css';
import Header from './components/header/header';
import Card from './components/card/card';
import Footer from './components/footer/footer';
import Candidates from './components/candidates/candidates';
import VerifyVote from './components/verifyVote/verifyVote';
import ChartsPage from './components/Chart/chart';
import Error from './components/error/error'
import { BrowserRouter, Route, Switch} from 'react-router-dom';
import Login from './components/login/login';
import axios from 'axios';

const jwtToken = localStorage.getItem('JWT_TOKEN');
axios.defaults.headers.common['authorization'] = jwtToken;

const Vote = () => {
  return(
    <div id="container">
      <Header />
      <body id="body">
        <div id="page-content">
          <div >
            <br/>
            <Card 
              title='Welcome in voting app.'
              text='Choose one candidate and submit your vote.'
            />
            <br/>
            <Candidates/>
          </div>
        </div>
      </body>
      <Footer />
    </div>
)}

const Verify = () => {
  return(
    <div id="container">
      <Header />
      <body id="body">
        <VerifyVote />
      </body>
      <Footer />
    </div>
)}

const Result = () => {
  return(
    <div id="container">
      <Header />
      <body id="body">
        <ChartsPage />
      </body>
      <Footer />
    </div>
)}

const LoginPage = () => {
  return(
    <div id="container">
      <Header />
      <body id="body">
        <Login />
      </body>
      <Footer />
    </div>
)}

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={Vote} exact/>
        <Route path="/verify" component={Verify}/>
        <Route path="/result" component={Result}/>
        <Route path="/login" component={LoginPage}/> 
        <Route component={Error}/>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
