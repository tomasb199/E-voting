import React, {Component} from 'react';

class Card extends Component{

    render(){
        return(
            <div class="card card-body bg-light">
              <h5 class="card-title font-weight-bold">Welcome in voting app.</h5>
              <p class="card-text">Choose one candidate and submit your vote.</p>
            </div>
        );
    }
}
export default Card;