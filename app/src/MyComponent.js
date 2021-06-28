import React, {useState} from "react";
import { newContextComponents } from "@drizzle/react-components";
import { 
  Button,
  Form, 
  Table,
} from 'react-bootstrap';

const EIP712 = require('./eip712');
const EIP712TYPE = require('./eip712type');

const { AccountData, ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {
  /**
   * transactions array stores the offchain transactions
   */
  const [transactions, setTransactions] = useState([]);
  /**
   * Sends the offchain transactions to the blockchain
   * @param {*} e event
   */
  const commitTransactions = async (e) =>{
    const response = await drizzle.contracts["EIP712Demo"].methods["commitTransactions"](
      transactions.map(e=>e.from),
      transactions.map(e=>e.to),
      transactions.map(e=>parseInt(e.amount)),
      transactions.map(e=>e.signatureV),
      transactions.map(e=>e.signatureR),
      transactions.map(e=>e.signatureS)
    ).send({from:drizzleState.accounts[0]});
    console.log("response",response);
    alert('Transaction committed to blockchain successfully');
    setTransactions([]);
  }
  /**
   * Reads the transaction details and signs the transaction using EIP712.signTypedData helper
   * @param {*} event Event object
   */
  const handleSubmit = async (event)=>{
    event.preventDefault();
    console.log(event);
    const transaction = {
      to: event.target.elements[0].value,
      from: drizzleState.accounts[0],
      amount: event.target.elements[1].value,
      signatureV: 0,
      signatureR: '',
      signatureS: ''
    };
    const typedData = EIP712.createTypeData(
    EIP712TYPE,
    "EIP712Demo",
    new EIP712.DomainData(
        "EIP712Demo.Set", // domain name
        "v1", // domain version
        1337, //chainid
        drizzle.contracts["EIP712Demo"].address, //contract address
        "0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406"  //salt
    ), {
        whose:  drizzleState.accounts[0],
        container: {
            val: transaction.amount,
            to: transaction.to
        }
    });
    try {
      const sig = await EIP712.signTypedData(drizzle.web3, drizzleState.accounts[0], typedData);
      transaction.signatureV = sig.v;
      transaction.signatureR = sig.r;
      transaction.signatureS = sig.s;
      const updatedTransactions = [...transactions,transaction];
      setTransactions(updatedTransactions);
    } catch(e) {
      alert('Error '+e);
    }
  }

  return (
    <div className="App">
      
      <div className="section">
        <h2>Active Account</h2>
        <AccountData
          drizzle={drizzle}
          drizzleState={drizzleState}
          accountIndex={0}
          units="ether"
          precision={3}
        />
      </div>

      <div className="section">
        <h2>TestToken</h2>
        
        <p>
          <strong>Total Supply: </strong>
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="EIP712Demo"
            method="totalSupply"
            methodArgs={[{ from: drizzleState.accounts[0] }]}
          />{" "}
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="EIP712Demo"
            method="symbol"
            hideIndicator
          />
        </p>
        <p>
          <strong>My Balance: </strong>
          <ContractData
            drizzle={drizzle}
            drizzleState={drizzleState}
            contract="EIP712Demo"
            method="balanceOf"
            methodArgs={[drizzleState.accounts[0]]}
          />
        </p>
        <h3>Send Tokens onchain</h3>
        <ContractForm
          drizzle={drizzle}
          contract="EIP712Demo"
          method="transfer"
          labels={["To Address", "Amount to Send"]}
        />
        <h3>Send Tokens offchain</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicEmail">
            <Form.Label>To address</Form.Label>
            <Form.Control type="text" placeholder="To address" />
          </Form.Group>
          <Form.Group controlId="formBasicEmail">
            <Form.Label>Amount</Form.Label>
            <Form.Control type="text" placeholder="Amount" />
          </Form.Group>

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        {transactions.length ? (<div> 
          <h3>Pending offchain transactions</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(e=>
                (<tr>
                  <td> {e.from} </td>
                  <td> {e.to} </td>
                  <td> {e.amount}</td>
                </tr>)
              )}
            </tbody>
          </Table>
          <Button variant="primary" type="submit" onClick={commitTransactions}>
              Commit to blockchain
          </Button>
        </div>) : null}
      </div>
    </div>
  );
};
