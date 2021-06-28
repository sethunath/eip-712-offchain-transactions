import Web3 from "web3";
import EIP712Demo from "./contracts/EIP712Demo.json";

const options = {
  web3: {
    block: false,
    customProvider: typeof window.web3 !== 'undefined' ? new Web3(window.web3.currentProvider):new Web3("ws://localhost:7545"),
  },
  contracts: [EIP712Demo],
  events: {
    
  },
};

export default options;
