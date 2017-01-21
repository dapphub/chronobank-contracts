pragma solidity ^0.4.4;

import "./zeppelin/ownership/Shareable.sol";
import "Configurable.sol";

contract Managed is Configurable, Shareable {
  enum Vote {accept, revoke, deploy}
  enum Operations {createLOC,editLOC}
  Vote vote;
  Operations operations;
  uint public numAuthorizedKeys;
  mapping(address => bool) public authorizedKeys;
  mapping(bytes32 => PendingAction) internal pendingActions;
  struct PendingAction {
    string stringValue;
    uint value;
    address addr;
    Setting settings;
    Operations operation;
  }

  function Managed() {
    address owner  = msg.sender;
    authorizedKeys[owner] = true;
    numAuthorizedKeys++;
  }

  modifier onlyAuthorized() {
      if (isAuthorized(msg.sender)) {
          _;
      }
  }

  function isAuthorized(address key) returns(bool) {
      if (authorizedKeys[key]){
        return true;
      }
      else
        return false;
  }

  function addKey(address key) onlyAuthorized() {
    if (!authorizedKeys[key]) { // Make sure that the key being submitted isn't already CBE.
      authorizedKeys[key] = true;
      numAuthorizedKeys++;
    }
  }

  function revokeKey(address key) onlyAuthorized() {
    if (authorizedKeys[key]) { // Make sure that the key being submitted isn't already CBE.
      authorizedKeys[key] = false;
      numAuthorizedKeys--;
    }
  }

}
