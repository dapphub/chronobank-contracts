pragma solidity ^0.4.4;

import "Configurable.sol";

contract LOC is Configurable {
  Status public status;

  function LOC(string _name, address _mint, address _controller, uint _issueLimit, string _publishedHash, uint _expDate){
    status = Status.maintenance;
    contractOwner = _controller;
    settings[uint(Setting.name)] = _name;
    settings[uint(Setting.publishedHash)] = _publishedHash;
    values[uint(Setting.issueLimit)] = _issueLimit;
  }
 
  function getName() constant returns(string) {
    return settings[uint(Setting.name)];
  }

  function getValue(uint name) constant returns(string) {
    return settings[name];
  }

  function setStatus(Status _status) onlyContractOwner {
    status = _status;
  }

  function setName(string _name) onlyContractOwner {
    settings[uint(Setting.name)] = _name;
  }

  function setWebsite(string _website) onlyContractOwner {
    settings[uint(Setting.website)] = _website;
  }
}
