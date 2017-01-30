pragma solidity ^0.4.4;

import "StringLib.sol";
import "Configurable.sol";

contract LOC is Configurable {
  using StringLib for StringLib;
  address controller;
  Status public status;

  function LOC(string _name, address _mint, address _controller, uint _issueLimit, string _publishedHash, uint _expDate){
    status = Status.maintenance;
    controller = _controller;
    settings[uint(Setting.name)] = _name;
    settings[uint(Setting.publishedHash)] = _publishedHash;
    settings[uint(Setting.issueLimit)] = bytes32ToString(StringLib.uintToBytes(_issueLimit));
  }
 
  function isController(address _ad) returns(bool) {
    if (_ad == controller)
      return true;
    else
      return false;
  }

  modifier onlyController() {
    if (isController(msg.sender) && status == Status.active) {
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

  function getController() constant returns(address) {
    return controller;
  }

  function setStatus(Status _status) onlyController {
    status = _status;
  }

  function setController(address _controller) onlyController {
    controller =  _controller;
  }

  function setName(string _name) onlyController {
    settings[uint(Setting.name)] = _name;
  }

  function setWebsite(string _website) onlyController {
    settings[uint(Setting.website)] = _website;
  }
}
