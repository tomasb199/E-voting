/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-direct-mutation-state */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import ReactTable from 'react-table';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import {confirm} from "../confirmation/confirmation";
import axios from 'axios';
import {CSVLink} from "react-csv";
import 'react-table/react-table.css';
import 'react-notifications/lib/notifications.css';
import FileReader from '../fileReader/fileReader';
import InputID from '../inputID/inputID'

const { encryptWithProof} = require('paillier-in-set-zkp')
const paillier = require('paillier-js')
var bigInt = require("big-integer");

class Candidates extends Component{

    constructor(props) {
        super(props);
        this.state = {
            pubKey: [],
            candidates: [],
            vote: null,
            voteName: '',
            bits: null,
            random: '',
            isFinish: false,
            id: null,
            isSending: false,
        }
        this.handleOnClickVote = this.handleOnClickVote.bind(this);
        this.output = this.output.bind(this);
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

    handleOnClickVote = () => {
        
        if(this.state.vote == null){
            NotificationManager.error('Choose one candidate!', 'Your vote is empty');
            return;
        }

        if(this.state.id == null){
            NotificationManager.error('Enter your ID!', 'Your ID is empty');
            return;
        }
        confirm('Are you sure vote - ' + this.state.voteName + '?').then(
            () => {
                var validScores = this.state.candidates.map(function (obj) {
                    return obj.Record.Vote;
                });
                console.log(validScores);
                console.time('encrypt');
        
                const publicKey = new paillier.PublicKey(bigInt(this.state.pubKey.n), this.state.pubKey.g);
                
                const [cipher, proof, random] = encryptWithProof(publicKey, this.state.vote, validScores, this.state.bits);
                console.log("Cipher: " + cipher);
                console.log("Proof:" + proof);
                console.log("Random:" + random);
                this.setState({random: random.toString()});
                this.state.random = random.toString();
                console.timeEnd('encrypt');
                var vote = {
                    id: this.state.id,
                    Vote: cipher,
                    Proof: proof 
                }
                console.log(this.state.voteName);
        
                axios.post('/voting-app/vote', vote)
                    .then(response => {
                        console.log(response);
                        if(response.data == true){
                            this.setState({isFinish: true});
                            NotificationManager.success('Your vote is counted :-)', 'SUCCESS!');
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        NotificationManager.error('Your vote is not counted :-(', 'ERROR!');
                    })
            }
          );
    }

    handleForce = data => {
        console.log(data);
    };
    output = data => {
        this.state.id = data;
        console.log(data);
    };
    addFile = event => {
        console.log(event.target.files[0]);
    }

    render(){
        const columns = [
            {
                Header: "Vote",
                style:{
                    textAlign: "center"
                },
                Cell: props =>{
                    return(
                        <div class="radio">
                            <label><input type="radio" name="optradio"
                                onClick={() =>{
                                    this.state.vote = props.original.Record.Vote;
                                    this.state.voteName = props.original.Record.Name;
                                }}
                            /></label>
                        </div>
                    )
                },
                sortable: false,
                width: 75,
                maxWidth:75,
                minWidth:75
            },
            {
                Header: "ID",
                accessor: "Record.ID",
                style:{
                    textAlign: "center"  
                },
                width: 75,
                maxWidth: 75,
                minWidth: 75
            },
            {
                Header: "Name",
                accessor: "Record.Name",
                style:{
                    textAlign: "center"  
                }
                
            },
            {
                Header: "Party",
                accessor: "Record.Description",
                style:{
                    textAlign: "center"  
                },
                filterable: false
            },
            {
                Header: "Age",
                accessor: "Record.Age",
                style:{
                    textAlign: "center"  
                },
                filterable: false,
            }
        ]
        
        return (
            <div>
                <InputID func={this.output}/>
                <ReactTable
                    className="-striped -highlight"
                    defaultPageSize={5}
                    minRows={1}
                    columns={columns}
                    data={this.state.candidates}
                >
                </ReactTable>
                <Button variant="success" onClick={this.handleOnClickVote}>Vote</Button>
                {this.state.isFinish &&
                    <CSVLink
                    data={this.state.random}
                    filename={"my-file.csv"}
                    className="btn btn-info"
                    target="_blank"
                  >
                    Download me
                  </CSVLink>
                }
                {this.state.isFinish &&
                <FileReader onFileLoaded={this.handleForce}/>
                }
                <NotificationContainer/>
            </div>
            
        );
    }
}

export default Candidates;
