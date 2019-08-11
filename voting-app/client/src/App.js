import React from 'react';
import './App.css';
import Header from './components/header/header';
import Card from './components/card/card';
import Footer from './components/footer/footer';
import Candidates from './components/candidates/candidates';
import VerifyVote from './components/verifyVote/verifyVote';
import Error from './components/error/error'
import { BrowserRouter, Route, Switch} from 'react-router-dom';

const NewRoute = () => {
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
            <Candidates />
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

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={NewRoute} exact/>
        <Route path="/verify" component={Verify}/>
        <Route component={Error}/>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
