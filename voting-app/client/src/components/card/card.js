import React from "react";

const Card = props => {
  return (
    <div className="card card-body bg-light">
      <h5 className="card-title font-weight-bold">{props.title}</h5>
      <p className="card-text">{props.text}</p>
    </div>
  );
};
export default Card;
