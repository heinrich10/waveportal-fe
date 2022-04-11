import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';

const GAS_LIMIT = 300000;

export default function App() {

  const [currentAccount, setCurrentAccount] = useState('');
  const [count, setCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const contractAddress = '0x3B7579ab94b968499218A5b95E0A9E696A8565c6'
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        throw new Error("eth object does not exist")
      }
    } catch (err) {
      console.log(err);
    }
  };
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        console.log('We have the eth object', ethereum);
      } else {
        console.log('Please install metamask');
        throw new Error('metamask not found');
      }

      const accounts = await ethereum.request({ method: "eth_accounts"});

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('found an authorized account', account);
        setCurrentAccount(account);
      } else {
        console.log('no authorized account found');
        throw new Error('no authorized account found');
      }
    } catch (err) {
      console.log(err);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Please install metamask');
        throw new error('please install metamask');
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts'});
      console.log('connected', accounts[0]);
      setCurrentAccount(accounts[0])
    } catch (err) {
      console.log(err)
    }
  }

  const getCount = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      let bCount = await wavePortalContract.getTotalWaves();
      let cnt = bCount.toNumber();
      console.log('waves', cnt);
      setCount(cnt);
    } catch (err) {
      console.log(err)
    }
  };

  const NewWaveListener = () => {
    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      console.log("newWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        }
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  };
  useEffect(() => {
    checkIfWalletIsConnected();
    getCount();
    getAllWaves();
    NewWaveListener();
  }, []);
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let bCount = await wavePortalContract.getTotalWaves();
        console.log('waves', bCount.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: GAS_LIMIT });
        console.log('Mining ...', waveTxn.hash);
        setLoading(true)

        await waveTxn.wait();
        console.log('Mined', waveTxn.hash);
        setLoading(false)

        bCount = await wavePortalContract.getTotalWaves();
        let cnt = bCount.toNumber();
        console.log('waves++', cnt);
        setCount(cnt);
      } else {
        throw new Error('eth object does not exist')
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      alert('Something went wrong, please try again');
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am Rick and I worked on different projects so that's pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <div className="bio">
          Number of waves: {count}
        </div>
        
        {loading && (
        <div>
          <div className="bio">Processing transaction, may take up to 20 mins</div>
          <div className="loader"></div>
        </div>)}
        <label for="msg" className="label">Input Message Here:</label>
        <input 
          type="text" 
          id="msg"
          value={message} 
          onChange={e => setMessage(e.target.value)}>
        </input>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

