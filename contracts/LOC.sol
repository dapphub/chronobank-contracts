pragma solidity ^0.4.4;

import "ChronoMintConfigurable.sol";

contract LOC is ChronoMintConfigurable {
  enum Status {maintenance, active, suspended, bankrupt}
  Status public status;

  function setLOCdata(string _name, address _mint, address _controller, uint _issueLimit, string _publishedHash, uint _expDate){
    chronoMint = _mint;
    status = Status.maintenance;
    contracts[uint(Setting.controller)] = _controller;
    settings[uint(Setting.name)] = _name;
    settings[uint(Setting.publishedHash)] = _publishedHash;
    settings[uint(Setting.issueLimit)] = bytes32ToString(bytes32(_issueLimit));
  }
 
  function approved() onlyMint{
    setStatus(Status.active);
  }

  function isController(address _ad) returns(bool) {
    if (_ad == contracts[uint(Setting.controller)])
      return true;
    else
      return false;
  }

  modifier onlyController() {
    if ((isController(msg.sender) && status == Status.active) || isMint(msg.sender)) {
      _;
      } else {
        return;
      }
  }

  function getName() constant returns(string) {
    return settings[uint(Setting.name)];
  }

  function getValue(uint name) constant returns(string) {
    return settings[name];
  }

  function getAddress(uint name) constant returns(address) {
    return contracts[name];
  }

  function setStatus(Status _status) onlyMint {
    status = _status;
  }

  function setController(address _controller) onlyController {
    contracts[uint(Setting.controller)] =  _controller;
  }

  function setName(string _name) onlyController {
    settings[uint(Setting.name)] = _name;
  }

  function setWebsite(string _website) onlyController {
    settings[uint(Setting.website)] = _website;
  }
}
