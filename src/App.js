import logo from './logo.svg';
import './App.css';
import React from "react";
import UploadToS3 from "./UploadToS3";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <h1>Filter Slide Upload to S3</h1>
      <UploadToS3 />
      </header>
    </div>
  );
}

export default App;
