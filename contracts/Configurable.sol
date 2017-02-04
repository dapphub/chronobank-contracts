pragma solidity ^0.4.4;

import "Owned.sol"; 
import "EternalStorage.sol";

contract Configurable is Owned {
  enum Setting {name,website,controller,issueLimit,issued,redeemed,publishedHash,expDate,timeProxyContract,rewardsContract,exchangeContract,proxyContract,securityPercentage,liquidityPercentage,insurancePercentage,insuranceDuration,lhProxyContract}
  enum Status {maintenance, active, suspended, bankrupt}
  mapping(uint => string) internal settings;
  mapping(uint => uint) internal values;
  mapping(uint => address) internal contracts;

  address public eternalStorage;

  function setStorage(address _eternalStorage) {
    eternalStorage = _eternalStorage;
  }

  function getValue(uint name) constant returns(uint) {
    return values[name];
  }

  function getString(uint name) constant returns(string) {
    return settings[name];
  }

  function setString(uint name, string value) onlyContractOwner {
    settings[name] = value;
  }

  function setValue(uint name, uint value) onlyContractOwner {
    values[name] = value;
  }

}
