pragma solidity ^0.4.4;

import "./Configurable.sol";
import "./Shareable.sol";

contract Managed is Configurable, Shareable {

  enum Operations {createLOC,editLOC,addLOC,removeLOC,editMint}
  mapping (bytes32 => Transaction) txs;
  event Test(uint test);
  uint numAuthorizedKeys = 1;
  address[] own;

  struct Transaction {
    address to;
    bytes data;
    Operations op;
  }

  function Managed() Shareable(own,required) {
    required = 2;
    address owner  = msg.sender;
    owners[numAuthorizedKeys] = uint(owner);
    ownerIndex[uint(owner)] = numAuthorizedKeys;
    numAuthorizedKeys++;
  }

  function setRequired(uint _required) onlyAuthorized() {
    if(_required > 1) {
      required = _required; 
    }
  }

  modifier onlyAuthorized() {
      if (isAuthorized(msg.sender)) {
          _;
      }
  }

  modifier execute(Operations _type) {
   if(numAuthorizedKeys > 2) {
   if (this != msg.sender) {
      bytes32 _r = sha3(msg.data,"signature");
      txs[_r].data = msg.data;
      txs[_r].op = _type;
      txs[_r].to = this;
      confirm(_r);
    } 
    else {
     _;
    }
  } else {
  _;
  }
 }

  function confirm(bytes32 _h) onlymanyowners(_h) returns (bool) {
     if (txs[_h].to != 0) {
      if(!txs[_h].to.call(txs[_h].data)) {
        throw;
      }
      delete txs[_h];
      return true;
      }
  }
  
  function isAuthorized(address key) returns(bool) {
      if(ownerIndex[uint(key)] != uint(0x0) || this == key) {
        return true;
      }
      return false;
  } 

  function addKey(address key) execute(Operations.createLOC) {
    if (ownerIndex[uint(key)] == uint(0x0)) { // Make sure that the key being submitted isn't already CBE.
      owners[numAuthorizedKeys] = uint(key);        
      ownerIndex[uint(key)] = numAuthorizedKeys;
      numAuthorizedKeys++;
    }
  }

  function revokeKey(address key) execute(Operations.createLOC) {
    if (ownerIndex[uint(key)] != uint(0x0)) { // Make sure that the key being submitted isn't already CBE.
      delete ownerIndex[uint(key)];
      remove(ownerIndex[uint(key)]);
      numAuthorizedKeys--;
    }
  }

 function remove(uint index){
        if (index >= owners.length) return;

        for (uint i = index; i<owners.length-1; i++){
            owners[i] = owners[i+1];
        }
        delete owners[owners.length-1];
    }


}
