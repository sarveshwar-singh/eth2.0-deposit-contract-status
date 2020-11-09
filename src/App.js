import React, { useState, useEffect } from "react";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './App.css';
import Web3 from 'web3';

const depositeContractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"pubkey","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"withdrawal_credentials","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"amount","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"signature","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"index","type":"bytes"}],"name":"DepositEvent","type":"event"},{"inputs":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"withdrawal_credentials","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"get_deposit_count","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"get_deposit_root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"}];
const config = {
  node: 'wss://mainnet.infura.io/ws/v3/810e7e7563ad46f38bd40bd8b332b322',
  address: '0x00000000219ab540356cBB839Cbe05303d7705Fa' // deposite contract address
};
const provider = new Web3.providers.WebsocketProvider(config.node);
const web3 = new Web3(provider);

const contract = new web3.eth.Contract(depositeContractABI);
contract.options.address = config.address;

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);


  async function loadData() {
    try {
      setLoading(true);
      const resultTemp = {};

      const totalCallCountHex = await contract.methods.get_deposit_count().call();
      const totalCallCount = parseInt(totalCallCountHex.substring(2).match(/../g).reverse().join(''), 16)
      resultTemp.totalCallCount = totalCallCount;
      console.log("Total count : ", totalCallCount);
    
      const allDepositEvents = await contract.getPastEvents(
        'DepositEvent',
        {
          fromBlock: 0,
        }
      );
    
      console.log("---------------");
      resultTemp.invalidRegistry = [];

      let validCount = 0;
      allDepositEvents.forEach(event => {
        const amount = event.returnValues.amount;
        const amountDecimal = parseInt(amount.substring(2).match(/../g).reverse().join(''), 16);
    
        if (amountDecimal >= 32000000000) {
          validCount++;
        } else {
          console.log("TxHash : ", event.transactionHash);
          console.log("Block number :", event.blockNumber);
          console.log("Amount : ", amountDecimal);
          console.log("---------------");
          resultTemp.invalidRegistry.push({
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            amount: amountDecimal
          });
        }
      });

      resultTemp.validCount = validCount;
    
      console.log("Total count : ", totalCallCount);
      console.log("Valid Count : " + validCount);

      setResult(resultTemp);
          
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    loadData();
  }, []);

  let content = {};
  if(loading) {
    content = <p>Loading...</p>
  } else {
    content = (
      <div>
        <div style={ {maxWidth: "300px"} }>
          <CircularProgressbar 
            value={result.validCount}
            maxValue={16384}
            text={`${(result.validCount/16384 * 100).toFixed(2)}%`}
          />
        </div>
        <p>{result.validCount} validators registered, more {Math.max(16384 - result.validCount, 0)} needed to fill 16384</p>
        <p>Invalid Registry ({result.invalidRegistry.length}) :</p>
        <table className="styled-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Transaction Hash</th>
              <th>Block</th>
              <th>Amount</th>
            </tr> 
          </thead>
          <tbody>
            {result.invalidRegistry.map((item, index) => {
              const link = `https://etherscan.io/tx/${item.transactionHash}`
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><a rel={"noopener noreferrer"} target="_blank" href={link}>{item.transactionHash}</a></td>
                  <td>{item.blockNumber}</td>
                  <td>{(item.amount/1000000000).toFixed(6)}&nbsp;ETH</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  return(
    <div
      style={{
          position: 'absolute', left: '50%',
          transform: 'translate(-50%, 0%)',
          paddingTop: '30px'
      }}
    >
      {content}
    </div>
  );
}

export default App;
