import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
import { MDBContainer } from "mdbreact";
import axios from "axios";

class ChartsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: [],
      labels: []
    };
  }

  async componentDidMount() {
    axios
      .get("/voting-app/candidates/")
      .then(response => response.data)
      .then(candidates => {
        const labels = candidates.map(function(obj) {
          return obj.Record.Name;
        });
        this.setState({ labels });
        console.log(this.state.labels);
      });

    axios
      .get("/voting-app/getResult/")
      .then(response => response.data)
      .then(result => {
        this.setState({ result });
        console.log("Result:", this.state.result);
      });
  }

  render() {
    const dataBar = {
        labels: this.state.labels,
        datasets: [
          {
            label: "sum of Votes",
            data: this.state.result,
            backgroundColor: [
              "rgba(255, 134,159,0.4)",
              "rgba(98,  182, 239,0.4)",
              "rgba(255, 218, 128,0.4)",
              "rgba(113, 205, 205,0.4)",
              "rgba(170, 128, 252,0.4)",
              "rgba(255, 177, 101,0.4)"
            ],
            borderWidth: 2,
            borderColor: [
              "rgba(255, 134, 159, 1)",
              "rgba(98,  182, 239, 1)",
              "rgba(255, 218, 128, 1)",
              "rgba(113, 205, 205, 1)",
              "rgba(170, 128, 252, 1)",
              "rgba(255, 177, 101, 1)"
            ]
          }
        ]
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
                color: "rgba(0, 0, 0, 0.1)"
              }
            }
          ],
          yAxes: [
            {
              gridLines: {
                display: true,
                color: "rgba(0, 0, 0, 0.1)"
              },
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      };

    return (
      <MDBContainer>
        <h3 className="mt-5">Voting result</h3>
        <Bar data={dataBar} options={barChartOptions} />
      </MDBContainer>
    );
  }
}

export default ChartsPage;
