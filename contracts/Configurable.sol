pragma solidity ^0.4.4;

import "Owned.sol"; 

contract Configurable is Owned {
  enum Setting {name,website,mint,controller,issueLimit,issued,redeemed,publishedHash,expDate,timeContract,rewardsContract,exchangeContract,proxyContract,securityPercentage,liquidityPercentage,insurancePercentage,insuranceDuration}
  enum Status {maintenance, active, suspended, bankrupt}
  mapping(uint => string) internal settings;
  mapping(uint => uint) internal values;
  mapping(uint => address) internal contracts;

  function getValue(uint name) constant returns(string) {
    return settings[name];
  }

  function setValue(uint name, string value) onlyContractOwner {
    settings[name] = value;
  }

}
