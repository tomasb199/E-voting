import React from "react";
import Button from "react-bootstrap/Button";
import "./menu.css";

const Menu = props => {
  return (
    <div id="center" className="card bg-light mb-3">
      <h5 className="card-header text-center font-weight-bold">Menu</h5>
      <div className="centerButtons card-body">
        <Button
          className="btn btn-success btn-lg btn-block"
          onClick={() => props.history.push("/vote")}
        >
          Cast Vote
        </Button>
        <Button
          className="btn btn-success btn-lg btn-block"
          onClick={() => props.history.push("/verify")}
        >
          Verify Vote
        </Button>
      </div>
    </div>
  );
};

export default Menu;
