import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import Header from './components/header/header';
import Card from './components/card/card';
import Footer from './components/footer/footer';
import Candidates from './components/candidates/candidates';

function App() {
  return (
    <div id="container">
      <Header />
      <body id="body">
        <div id="page-content">
          <div >
            <br/>
            <Card />
            <br/>
            <Candidates />
          </div>
        </div>
      </body>
    <Footer />
    </div>
  );
}

export default App;
