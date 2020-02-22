import React from "react";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Vote from "./components/vote/vote";
import VerifyVote from "./components/verifyVote/verifyVote";
import AfterSign from "./components/candidates/afterSign";
import ChartsPage from "./components/chart/chart";
import Error from "./components/error/error";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Login from "./components/login/login";
import Menu from "./components/menu/menu";
//import ProtectedRoute from "./authentication/protectedRoute";
import "./App.css";

function App() {
  return (
    <div id='container'>
      <BrowserRouter>
        <Route path='/' component={Header} />
        <div id='body'>
          <Switch>
            <Route path='/login' component={Login} exact />
            <Route path='/' component={Menu} exact />
            <Route path='/vote' component={Vote} exact />
            <Route path='/afterSign' component={AfterSign} exact />
            <Route path='/verify' component={VerifyVote} />
            <Route path='/result' component={ChartsPage} exact />
            <Route path='*' component={Error} />
          </Switch>
        </div>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
