pragma solidity ^0.4.4;

import "Configurable.sol";
import "./zeppelin/ownership/Shareable.sol";

contract Managed is Configurable, Shareable {
  enum Operations {createLOC,editLOC}
  uint public numAuthorizedKeys;
  mapping(address => bool) public authorizedKeys;
  uint pendingTxsCount;
  mapping (uint => bytes32) pendingTxs;
  mapping (bytes32 => Transaction) txs;

  struct Transaction {
    bytes data;
    Operations op;
    bool initialized;
  }

  function Managed() {
    address owner  = msg.sender;
    authorizedKeys[owner] = true;
    owners[numAuthorizedKeys] = uint(owner);
    numAuthorizedKeys++;
  }

  function setRequired(uint _required) {
    required = _required; 
  }

  modifier onlyAuthorized() {
      if (isAuthorized(msg.sender)) {
          _;
      }
  }

  modifier execute(Operations _type) {
   bytes32 _r = sha3(msg.data, block.number);
   if(txs[_r].initialized) {
    if (!confirm(_r)) {
      txs[_r].data = msg.data;
      txs[_r].op = _type;
      pendingTxs[pendingTxsCount] = _r;
      pendingTxsCount++;
    } 
    else {
      _;
    }
   }
  }

  function confirm(bytes32 _h) onlymanyowners(_h) returns (bool) {
      if (!this.call(txs[_h].data)) {
        throw;
      }
      delete txs[_h];
      return true;
  }

  function isAuthorized(address key) returns(bool) {
      return authorizedKeys[key];
  }

  function addKey(address key) onlyAuthorized() {
    if (!authorizedKeys[key]) { // Make sure that the key being submitted isn't already CBE.
      authorizedKeys[key] = true;
      owners[numAuthorizedKeys] = uint(key);
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
