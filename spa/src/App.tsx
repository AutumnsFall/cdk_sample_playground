import React from 'react';
import logo from './logo.svg';
import './App.scss';
import spaConfig from 'spa.json';
import { LambdaPayload } from './components/lambdaFetch';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>SPA on AWS CDK with React and TypeScript: {spaConfig.stage}</p>
        {spaConfig.fetchFromLambda ? (
          <LambdaPayload />
        ) : (
          <div>Fetching from Lambda is disabled</div>
        )}
      </header>
    </div>
  );
}

export default App;
