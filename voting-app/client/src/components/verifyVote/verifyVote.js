/* eslint-disable react/no-direct-mutation-state */
import React, {Component} from 'react';
import Card from '../card/card';
import Button from 'react-bootstrap/Button';
import FileReader from '../fileReader/fileReader';
import ReactTable from 'react-table';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import axios from 'axios';

var bigInt = require("big-integer");

class VerifyVote extends Component{

    constructor(props) {
        super(props);
        this.state = {
            pubKey: [],
            candidates: [],
            id: undefined,
            random: undefined,
            Vote: undefined,
            currentVote: undefined,
            publicKey: undefined,
        }
    }

    componentDidMount() {
        fetch('/voting-app/candidates/',{
            method: "GET"})
            .then(res => res.json())
            .then(candidates => this.setState({candidates}, () => console.log('Candidates fetched..',
            candidates)
            ));
        fetch('/voting-app/getPubKey/',{
            method: "GET"})
            .then(res => res.json())
            .then(pubKey => this.setState({pubKey}, () => console.log('Public Key fetched..',
            pubKey)
            ));
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
                NotificationManager.success('Your voting file was correct input :-)', 'Success!');
            })
              .catch(function (error) {
                console.log(error);
              })
              .then(function () {
                // always executed
              }); 
        }
        else{
            NotificationManager.error('Your voting file is not correct :-(', 'ERROR!');
            return;
        }
    };

    verify = async () => {
        
        if(this.state.id === undefined || this.state.random === undefined){
            NotificationManager.error('Enter your voting file.', 'WARNING!');
            return;
        }
        else if(this.state.Vote === undefined){
            NotificationManager.error('Choose one candidate!', 'Your vote is empty');
            return;
        }
        else{
            const g = bigInt(this.state.pubKey.g);
            const r = bigInt(this.state.random);
            const newCipher = g.modPow(bigInt(this.state.currentVote.Vote), this.state.pubKey._n2).multiply(r.modPow(this.state.pubKey.n, this.state.pubKey._n2)).mod(this.state.pubKey._n2);
            if(newCipher.eq(this.state.Vote.toString())){
                NotificationManager.success('Your vote is counted and is same as current :-)', 'SUCCESS!');
            }
            else{
                NotificationManager.error('Your vote is not same as current :-(', 'SUCCESS!');
            }
        }
    }

    render(){

        const divStyle = {
            fontWeight: 'bold',
        };

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
                                    this.state.currentVote = props.original.Record;
                                }}
                            /></label>
                        </div>
                    )
                },
                sortable: false,
                width: 75,
                maxWidth:75,
                minWidth:75,
                headerStyle: divStyle,
            },
            {
                Header: "ID",
                accessor: "Record.ID",
                style:{
                    textAlign: "center"  
                },
                width: 75,
                maxWidth: 75,
                minWidth: 75,
                headerStyle: divStyle,
            },
            {
                Header: "Name",
                accessor: "Record.Name",
                style:{
                    textAlign: "center"  
                },
                headerStyle: divStyle,
            },
            {
                Header: "Party",
                accessor: "Record.Description",
                style:{
                    textAlign: "center"  
                },
                filterable: false,
                headerStyle: divStyle,
            },
            {
                Header: "Age",
                accessor: "Record.Age",
                style:{
                    textAlign: "center"  
                },
                filterable: false,
                headerStyle: divStyle,
            }
        ]

        return(
            <div>
                <br/>
                <Card 
                title='Verify your vote.'
                text='Enter your voting file and choose your candidate.'
                />
                <br/>
                <FileReader onFileLoaded={this.handleForce}/>
                <ReactTable
                    className="-striped -highlight"
                    defaultPageSize={5}
                    minRows={1}
                    columns={columns}
                    data={this.state.candidates}
                >
                </ReactTable>
                <Button variant="success" onClick={this.verify}>Verify</Button>
                <NotificationContainer />
            </div>
        );
    }
}
export default VerifyVote;