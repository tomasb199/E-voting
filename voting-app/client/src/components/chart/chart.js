import React, { Component } from "react";
import { Bar, HorizontalBar, Pie } from "react-chartjs-2";
import Spinner from "../loading-spinner/loading-spinner";
import axios from "axios";

import "./chart.css";

class ChartsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      voteData: {},
      voteType: undefined,
      resultNames: [],
      resultNumbers: [],
      resultNumbersPercent: [],
      loading: true,
      selectParty: undefined,
      preferentialVotes: [],
      currentPreferentialVotesObj: {},
      selectedPartyIndex: undefined,
    };
  }

  async componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((voteData) => {
        this.setState({ voteType: voteData.voteType });
        this.setState({ voteData });
        console.time("decrypt");
        axios
          .get("http://localhost:5000/getResult")
          .then((response) => response.data)
          .then((result) => {
            console.timeEnd("decrypt");
            if (result === false) {
              this.setState({ loading: false });
              console.log("Result:", result);
              return;
            }
            result.decryptVotingResult.sort(function (a, b) {
              return -(a.res - b.res || a.name.localeCompare(b.name));
            });
            const resultNumbers = result.decryptVotingResult.map(
              (candidate) => {
                return candidate.res;
              }
            );
            this.setState({ resultNumbers });

            const sum = resultNumbers.reduce((a, b) => Number(a) + Number(b));
            const resultNumbersPercent = resultNumbers.map((item) => {
              return ((100 * Number(item)) / sum).toFixed(2);
            });
            console.log(resultNumbersPercent);
            this.setState({ resultNumbersPercent });

            const resultNames = result.decryptVotingResult.map((candidate) => {
              return candidate.name;
            });
            this.setState({ resultNames });

            if (voteData.voteType === 2) {
              console.log("Preferencial votes: ", result.PreferentialVotes);
              this.setState({ preferentialVotes: result.PreferentialVotes });
            }

            this.setState({ loading: false });
            console.log("Result:", result);
          });
      });
  }

  selectParty = (input) => {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((voteData) => {
        this.setState({ voteType: voteData.voteType });
        this.setState({ voteData });
        axios
          .get("http://localhost:5000/getResult")
          .then((response) => response.data)
          .then((result) => {
            if (result === false) {
              this.setState({ loading: false });
              console.log("Result:", result);
              return;
            }
            result.decryptVotingResult.sort(function (a, b) {
              return -(a.res - b.res || a.name.localeCompare(b.name));
            });
            const resultNumbers = result.decryptVotingResult.map(
              (candidate) => {
                return candidate.res;
              }
            );
            this.setState({ resultNumbers });
            const resultNames = result.decryptVotingResult.map((candidate) => {
              return candidate.name;
            });
            this.setState({ resultNames });

            if (voteData.voteType === 2) {
              console.log("Preferencial votes: ", result.PreferentialVotes);
              this.setState({ preferentialVotes: result.PreferentialVotes });
            }

            this.setState({ loading: false });
            console.log("Result:", result);
          });
      });

    const selectedPartyObj = this.state.voteData.candidate.find(
      (e) => e.Party === input
    );
    const currentLabels = selectedPartyObj.Candidates.map((c) => {
      return c.Name;
    });
    const data = {
      labels: currentLabels,
      datasets: [
        {
          label: "Count of votes",
          backgroundColor: "rgba(255,99,132,0.2)",
          borderColor: "rgba(255,99,132,1)",
          borderWidth: 1,
          hoverBackgroundColor: "rgba(255,99,132,0.4)",
          hoverBorderColor: "rgba(255,99,132,1)",
          data: this.state.preferentialVotes.find((v) => v.name === input).res,
        },
      ],
    };
    this.setState({ currentPreferentialVotesObj: data });
    this.setState({ selectParty: input });
  };

  render() {
    const dataBar = {
        labels: this.state.resultNames,
        datasets: [
          {
            label: "sum of Votes",
            data: this.state.resultNumbers,
            backgroundColor: [
              "rgba(255, 134,159,0.4)",
              "rgba(98,  182, 239,0.4)",
              "rgba(255, 218, 128,0.4)",
              "rgba(113, 205, 205,0.4)",
              "rgba(170, 128, 252,0.4)",
              "rgba(255, 177, 101,0.4)",
            ],
            borderWidth: 2,
            borderColor: [
              "rgba(255, 134, 159, 1)",
              "rgba(98,  182, 239, 1)",
              "rgba(255, 218, 128, 1)",
              "rgba(113, 205, 205, 1)",
              "rgba(170, 128, 252, 1)",
              "rgba(255, 177, 101, 1)",
            ],
          },
        ],
      },
      dataPie = {
        labels: this.state.resultNames,
        datasets: [
          {
            data: this.state.resultNumbersPercent,
            backgroundColor: [
              "rgba(255, 134,159,0.4)",
              "rgba(98,  182, 239,0.4)",
              "rgba(255, 218, 128,0.4)",
              "rgba(113, 205, 205,0.4)",
              "rgba(170, 128, 252,0.4)",
              "rgba(255, 177, 101,0.4)",
            ],
            borderColor: [
              "rgba(255, 134, 159, 1)",
              "rgba(98,  182, 239, 1)",
              "rgba(255, 218, 128, 1)",
              "rgba(113, 205, 205, 1)",
              "rgba(170, 128, 252, 1)",
              "rgba(255, 177, 101, 1)",
            ],
          },
        ],
      },
      barChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          xAxes: [
            {
              barPercentage: 1,
              gridLines: {
                display: false,
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                precision: 0,
              },
            },
          ],
          yAxes: [
            {
              gridLines: {
                display: true,
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                eginAtZero: true,
                precision: 0,
              },
            },
          ],
        },
      };

    return (
      <div className=''>
        {!this.state.loading && (
          <div className=''>
            <div className='row'>
              <div className='col-sm card'>
                <h3 className='mt-5 font-weight-bold'>Voting result</h3>
                <Bar
                  data={dataBar}
                  options={barChartOptions}
                  getElementsAtEvent={(elems) => {
                    if (this.state.voteType === 2) {
                      this.selectParty(this.state.resultNames[elems[0]._index]);
                    }
                  }}
                />
              </div>
              <div className='col-sm card'>
                {this.state.voteType === 2 &&
                  Object.getOwnPropertyNames(
                    this.state.currentPreferentialVotesObj
                  ).length >= 1 && (
                    <div>
                      <h4 className='mt-5 font-weight-bold'>
                        Preferential votes for {this.state.selectParty}
                      </h4>
                      <HorizontalBar
                        data={this.state.currentPreferentialVotesObj}
                        options={barChartOptions}
                      />
                    </div>
                  )}
                {this.state.voteType === 1 && (
                  <div>
                    <h4 className='mt-5 font-weight-bold'>
                      Result in percentage
                    </h4>
                    <Pie data={dataPie} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <Spinner show={this.state.loading} />
      </div>
    );
  }
}

export default ChartsPage;
