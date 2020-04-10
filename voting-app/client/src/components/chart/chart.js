import React, { Component } from "react";
import { Bar, Pie } from "react-chartjs-2";
import Spinner from "../loading-spinner/loading-spinner";
import axios from "axios";

class ChartsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: [],
      labels: [],
      resultNames: [],
      resultNumbers: [],
      resultNumbersPercent: [],
      loading: true,
    };
  }

  async componentDidMount() {
    axios
      .get("http://localhost:8000/voting-app/candidates/")
      .then((response) => response.data)
      .then((candidates) => {
        const labels = candidates.map(function (obj) {
          return obj.Record.Name;
        });
        this.setState({ labels });
        console.log(this.state.labels);
        console.time("decrypt");
      })
      .then(
        axios
          .get("http://localhost:5000/getResult/")
          .then((response) => response.data)
          .then((result) => {
            console.timeEnd("decrypt");
            this.setState({ result });
            console.log("Result:", this.state.result);

            result.sort(function (a, b) {
              return -(a.res - b.res || a.name.localeCompare(b.name));
            });
            const resultNumbers = result.map((candidate) => {
              return candidate.res;
            });
            this.setState({ resultNumbers });
            const resultNames = result.map((candidate) => {
              return candidate.name;
            });
            this.setState({ resultNames });

            const sum = resultNumbers.reduce((a, b) => Number(a) + Number(b));
            const resultNumbersPercent = resultNumbers.map((item) => {
              return ((100 * Number(item)) / sum).toFixed(2);
            });
            console.log(resultNumbersPercent);
            this.setState({ resultNumbersPercent });

            this.setState({ loading: false });
          })
      );
  }

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
            },
          ],
          yAxes: [
            {
              gridLines: {
                display: true,
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      };

    return (
      <div>
        {!this.state.loading && (
          <div className='row m-0'>
            <div className='col-sm card mr-2'>
              <h3 className='mt-5'>Voting result</h3>
              <Bar data={dataBar} options={barChartOptions} />
            </div>
            <div className='col-sm card'>
              <h4 className='mt-5'>Result in percentage</h4>
              <Pie data={dataPie} />
            </div>
          </div>
        )}
        <Spinner show={this.state.loading} />
      </div>
    );
  }
}

export default ChartsPage;
