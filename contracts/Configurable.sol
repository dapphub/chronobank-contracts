pragma solidity ^0.4.4;

contract Configurable {
  enum Setting {name,website,mint,controller,issueLimit,issued,redeemed,publishedHash,expDate,timeContract,rewardsContract,exchangeContract,proxyContract,securityPercentage,liquidityPercentage,insurancePercentage,insuranceDuration}
  Setting setting;
  mapping(uint => string) internal settings;
  mapping(uint => address) internal contracts;

  function getVal(uint name) constant returns(string) {
    return settings[name];
  }

  function setVal(uint name, string value) internal {
    settings[name] = value;
  }

function bytes32ToString (bytes32 data) returns (string) {
    bytes memory bytesString = new bytes(32);
    for (uint j=0; j<32; j++) {
        byte char = byte(bytes32(uint(data) * 2 ** (8 * j)));
        if (char != 0) {
            bytesString[j] = char;
        }
    }
    return string(bytesString);
}

}
