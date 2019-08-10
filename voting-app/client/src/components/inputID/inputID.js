/* eslint-disable no-lone-blocks */
import React, {Component} from 'react';

class InputID extends Component{

    constructor(props) {
        super(props);
        this.updateInputValue = this.updateInputValue.bind(this);
    }
    
    updateInputValue(evt) {
        {this.props.func(evt.target.value)};
    }

    render(){
        return(
            <div className="form-group">
                <label htmlFor="ex2">Your ID</label>
                <input type="number" className="ex2" id="ID" onChange={this.updateInputValue}/>
            </div>
        );
    }
}
export default InputID;