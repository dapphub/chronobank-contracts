pragma solidity ^0.4.4;

import "Configurable.sol";
import "./zeppelin/ownership/Shareable.sol";
import "LibCLLi.sol";

contract Managed is Configurable, Shareable {

  uint constant HEAD = 0; // Lists are circular with static head.
  bool constant PREV = false;
  bool constant NEXT = true;
  uint constant MAXNUM = uint(-1); // 2**256 - 1
    
  // Allows us to use library functions as if they were members of the type.
  using LibCLLi for LibCLLi.CLL;

  // The circular linked list state variable.
  LibCLLi.CLL list;

  enum Operations {createLOC,editLOC}
  event needConfirm(uint txIndex);
  uint public numAuthorizedKeys;
  mapping(address => bool) public authorizedKeys;
  uint pendingTxsCount;
  mapping (uint => bytes32) pendingTxs;
  mapping (bytes32 => Transaction) txs;
  address[] own;

  struct Transaction {
    address to;
    bytes data;
    Operations op;
    bool initialized;
  }

  function Managed() Shareable(own,required) {
    required = 2;
    address owner  = msg.sender;
    authorizedKeys[owner] = true;
    owners[numAuthorizedKeys] = uint(owner);
    numAuthorizedKeys++;
  }

  function setRequired(uint _required) {
    required = _required; 
  }

  function getRequired() onlyAuthorized returns (uint) {
    return required;
  } 

  modifier onlyAuthorized() {
      if (isAuthorized(msg.sender)) {
          _;
      }
  }

  modifier execute(Operations _type) {
   needConfirm(pendingTxsCount);
   bytes32 _r = sha3(msg.data, block.number);
   if(!txs[_r].initialized) {
   if (!confirm(_r)) {
      txs[_r].data = msg.data;
      txs[_r].op = _type;
      txs[_r].initialized = true;
      txs[_r].to = msg.sender;
      pendingTxs[pendingTxsCount] = _r;
      pendingTxsCount++;
    } 
    else {
      _;
    }
   }
  }

  function confirm(bytes32 _h) onlymanyowners(_h) returns (bool) {
      if (!txs[_h].to.call(txs[_h].data)) {
        return false;
      }
      delete txs[_h];
      return true;
  }

  function isAuthorized(address key) returns(bool) {
      return authorizedKeys[key];
  }

  function addKey(address key) execute(Operations.createLOC) {
    if (!authorizedKeys[key]) { // Make sure that the key being submitted isn't already CBE.
      authorizedKeys[key] = true;
      owners[numAuthorizedKeys] = uint(key);
      numAuthorizedKeys++;
    }
  }

  function revokeKey(address key) execute(Operations.createLOC) {
    if (authorizedKeys[key]) { // Make sure that the key being submitted isn't already CBE.
      authorizedKeys[key] = false;
      numAuthorizedKeys--;
    }
  }

}
