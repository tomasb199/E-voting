/* eslint-disable react/no-direct-mutation-state */
import React, {Component} from 'react';
import FileReader from '../fileReader/fileReader';
import { NotificationManager } from 'react-notifications';
import axios from 'axios';
/*
const { rEncrypt } = require('paillier-in-set-zkp');
const paillier = require('paillier-js');
*/
class VerifyVote extends Component{

    constructor(props) {
        super(props);
        this.state = {
            pubKey: [],
            candidates: [],
            bits: undefined,
            id: undefined,
            random: undefined,
            Vote: undefined,
        }
    }

    componentDidMount() {
        fetch('/voting-app/candidates/',{
            method: "GET"})
            .then(res => res.json())
            .then(candidates => this.setState({candidates}, () => console.log('Candidates fetched..',
            candidates)));
        fetch('/voting-app/getPubKey/',{
            method: "GET"})
            .then(res => res.json())
            .then(pubKey => this.setState({pubKey}, () => console.log('Public Key fetched..',
            pubKey)));
        fetch('/voting-app/getBits/',{
            method: "GET"})
            .then(res => res.json())
            .then(bits => this.setState({bits}, () => console.log('Number of bits fetched..',
            bits)));
    }

    handleForce = data => {
        if(!isNaN(data[0][0]) && !isNaN(data[1][0])){
            this.state.id = data[0][0];
            this.state.random = data[1][0];
            console.log(data[0][0]);
            console.log(data[1][0]);
            axios.get('/voting-app/getVote', {
                params: {
                  ID: this.state.id
                }
              })
              .then(response => {
                this.setState({ Vote: response.data.Vote });
                console.log('Vote:' + this.state.Vote);

                //const newVote = rEncrypt();
                /*this.setState({isFinish: true});
                this.state.isFinish = true;
                NotificationManager.success('Your vote is counted :-)', 'SUCCESS!');*/
            })
              .catch(function (error) {
                console.log(error);
              })
              .then(function () {
                // always executed
              }); 
        }
        else{
            NotificationManager.error('Your is is not correct :-(', 'ERROR!');
            return;
        }
    };

    render(){
        return(
            <div>
                <FileReader onFileLoaded={this.handleForce}/>
            </div>
        );
    }
}
export default VerifyVote;