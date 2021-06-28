const TestToken = artifacts.require("TestToken");
const EIP712Demo = artifacts.require("EIP712Demo");

module.exports = function(deployer) {
  deployer.deploy(TestToken);
  deployer.deploy(EIP712Demo,1337);
};
