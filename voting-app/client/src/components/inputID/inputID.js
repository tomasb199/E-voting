/* eslint-disable no-lone-blocks */
import React from "react";
import "./inputID.css";

const InputID = props => {
  return (
    <div className="form-inline inputID">
      <b>Your ID</b>
      <input
        type="number"
        className="form-control col-md-2"
        onChange={props.output}
      />
    </div>
  );
};
export default InputID;
