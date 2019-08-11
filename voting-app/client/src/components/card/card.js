import React from 'react';

const Card = (props) => {
    
    return(
        <div class="card card-body bg-light">
            <h5 class="card-title font-weight-bold">{props.title}</h5>
            <p class="card-text">{props.text}</p>
        </div>
    );
}
export default Card;