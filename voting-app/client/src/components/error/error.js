/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import "./error.css";

const Error = props => {
  return (
    <div id="notfound">
      <div className="notfound">
        <div className="notfound-404">
          <div></div>
          <h1>404</h1>
        </div>
        <h2>Page not found</h2>
        <p>
          The page you are looking for might have been removed had its name
          changed or is temporarily unavailable.
        </p>
        <a onClick={() => props.history.push("/login")}>Login page</a>
      </div>
    </div>
  );
};

export default Error;
