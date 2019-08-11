/* eslint-disable no-lone-blocks */
import React from 'react';

const InputID = (props) => {

    return(
        <div className="form-group">
            <label htmlFor="ex2">Your ID</label>
            <input type="number" className="ex2" id="ID" onChange={props.output}/>
        </div>
    );
}
export default InputID;