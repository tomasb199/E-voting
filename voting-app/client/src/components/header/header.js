import React from "react";
import { Link } from "react-router-dom";
import "./header.css";
import logo from "./logo.png";
import auth from "../../authentication/auth";

const Header = props => {
  return (
    <div className="row App-header">
      <div className="col">
        <img
          src={logo}
          width="100px"
          height="100px"
          className="logo"
          alt="Logo"
        />
      </div>
      <div className="col title">
        <h1>Voting app</h1>
      </div>
      <div className="col logout">
        {auth.isAuthenticated() && (
          <Link
            className="link"
            onClick={() => {
              auth.logout(() => {
                props.history.push("/login");
              });
            }}
          >
            Logout
          </Link>
        )}
      </div>
    </div>
  );
};
export default Header;
