import React from "react";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Candidates from "./components/candidates/candidates";
import VerifyVote from "./components/verifyVote/verifyVote";
import ChartsPage from "./components/chart/chart";
import Error from "./components/error/error";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Login from "./components/login/login";
import Menu from "./components/menu/menu";
import ProtectedRoute from "./authentication/protectedRoute";
import "./App.css";

function App() {
  return (
    <div id="container">
      <BrowserRouter>
        <Route path="/" component={Header} />
        <body id="body">
          <Switch>
            <Route path="/login" component={Login} exact />
            <Route path="/" component={Menu} exact />
            <Route path="/verify" component={VerifyVote} />
            <Route path="/vote" component={Candidates} exact />
            <Route path="/result" component={ChartsPage} exact />
            <Route path="*" component={Error} />
          </Switch>
        </body>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
