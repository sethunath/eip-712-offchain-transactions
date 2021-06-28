pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EIP712Demo is ERC20 {
    bytes32 private constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");
    string public name = "DemoToken";
    string public symbol = "DT";
    uint256 public decimals = 2;
    uint256 public INITIAL_SUPPLY = 8000;
    /**
     * @notice Build a EIP712 domain separtor
     * @param domainNameHash    - hash of the domain name
     * @param domainVersionHash - hash of the domain version
     * @param chainId           - ID used to make signatures unique in different network
     * @param contractAddress   - Optionally to make signatures unique for different instance of the contract
     * @param domainSalt        - Furtherly to make signatures unique for other circumstances
     * @return the domain separator in bytes32
     */
    function buildDomainSeparator(
        bytes32 domainNameHash,
        bytes32 domainVersionHash,
        uint256 chainId,
        address contractAddress,
        bytes32 domainSalt
        ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            domainNameHash,
            domainVersionHash,
            chainId,
            contractAddress,
            domainSalt));
    }

    /**
     * @notice Valid a EIP712 signature
     * @param domainSeparator      - the domain separator for the message
     * @param messageHash          - hash of the message constructed according to EIP712
     * @param v                    - signature v component
     * @param r                    - signature r component
     * @param s                    - signature s component
     * @return whether if the signature is valid
     */
    function validateMessageSignature(
        bytes32 domainSeparator,
        bytes32 messageHash,
        uint8 v, bytes32 r, bytes32 s, address signedByWhom) internal pure returns (bool) {
        bytes32 fullhash = keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            messageHash));
        return ecrecover(fullhash, v, r, s) == signedByWhom;
    }

    mapping(address => int) values;

    // EIP712 domain separtor
    bytes32 private constant DEMO_DOMAIN_SALT = 0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406;
    bytes32 private constant DEMO_DOMAIN_NAME_HASH = keccak256("EIP712Demo.Set");
    bytes32 private constant DEMO_DOMAIN_VERSION_HASH = keccak256("v1");
    bytes32 private DEMO_DOMAIN_SEPARATOR;
    // EIP712 type definitions
    bytes32 private constant CONTAINER_TYPE_HASH = keccak256("Container(int256 val,address to)");
    bytes32 private constant DEMO_TYPE_HASH = keccak256("EIP712Demo(address whose,Container container)Container(int256 val,address to)");

    constructor(uint256 chainId) public {
        //mint the tokens
        _mint(msg.sender, INITIAL_SUPPLY);
        //hash the domain separator
        DEMO_DOMAIN_SEPARATOR = buildDomainSeparator(
            DEMO_DOMAIN_NAME_HASH,
            DEMO_DOMAIN_VERSION_HASH,
            chainId,
            address(this),
            DEMO_DOMAIN_SALT);
    }

    function set(int val) public {
        values[msg.sender] = val;
    }

    function get(address whose) public view returns (int) {
        return values[whose];
    }

    /**
     * Set the value on behalf of someone else by holding a valid EIP-712 signature
     * of that person.
     */
    function eip712_set(address whose, address to, int val,uint8 v, bytes32 r, bytes32 s) public view {
        bytes32 containerHash =  keccak256(abi.encode(
            CONTAINER_TYPE_HASH,
            val,
            to));
        bytes32 demoHash =  keccak256(abi.encode(
            DEMO_TYPE_HASH,
            whose,
            containerHash));
        require(validateMessageSignature(DEMO_DOMAIN_SEPARATOR, demoHash, v, r, s, whose), "Invalid signature");
    }
    
    
    function commitTransactions(address[] memory whose, address[] memory to, int[] memory val,uint8[] memory v, bytes32[] memory r, bytes32[] memory s) public {
        uint arrayLength = whose.length;
        for (uint i=0; i<arrayLength; i++) {
            eip712_set(whose[i],to[i],val[i],v[i],r[i],s[i]);
            super._transfer(whose[i],to[i],uint256(val[i]));
        }
    }
}
