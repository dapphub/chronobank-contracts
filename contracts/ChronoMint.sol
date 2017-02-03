pragma solidity ^0.4.4;

import "Managed.sol";
import "LOC.sol";
import "Wallet.sol";

contract ChronoMint is Managed,Wallet {

  uint private offeringCompaniesByIndex;
  mapping(uint => address) internal offeringCompanies;
  event newLOC(address _from, address _LOC);

  function getAddress(uint name) constant returns(address) {
    return contracts[name];
  }

  function isCBE(address key) returns(bool) {
      if (ownerIndex[uint(key)] > 0){
        return true;
      }
      else
        return false;
  }

  function setAddress(uint name, address value) onlyAuthorized() execute(Operations.editMint) {
    contracts[name] = value;
  }

  function pendingsCount() constant returns(uint) {
    return pendingsIndex.length;
  }
  
  function pendingById(uint _id) constant returns(bytes32) {
    return pendingsIndex[_id];
  }
  
  function pendingYetNeeded(bytes32 _hash) constant returns(uint) {
    return pendings[_hash].yetNeeded;
  }
 
  function addLOC (address _locAddr) onlyAuthorized() onlyAuthorized() execute(Operations.editMint) {
    offeringCompanies[offeringCompaniesByIndex] = _locAddr;
    offeringCompaniesByIndex++;
  }

  function removeLOC(address _locAddr) onlyAuthorized() execute(Operations.editMint) {
    delete offeringCompanies[offeringCompaniesByIndex];
    offeringCompaniesByIndex--;
  }

  function proposeLOC(string _name, string _website, uint _issueLimit, string _publishedHash, uint _expDate) onlyAuthorized() returns(address) {
    address locAddr = new LOC(_name,_website,this,_issueLimit,_publishedHash,_expDate);
    offeringCompanies[offeringCompaniesByIndex] = locAddr;
    newLOC(msg.sender, locAddr);
    offeringCompaniesByIndex++;
    return locAddr;
  }

  function setLOCStatus(address _LOCaddr, Status status) onlyAuthorized() execute(Operations.editLOC) {
     LOC(_LOCaddr).setStatus(status);
  }

  function setLOCValue(address _LOCaddr, Setting name, uint value) onlyAuthorized() execute(Operations.editLOC) {
    LOC(_LOCaddr).setValue(uint(name),value);
  }

  function setLOCString(address _LOCaddr, Setting name, string value) onlyAuthorized() {
    LOC(_LOCaddr).setString(uint(name),value);
  }

  function getLOCbyID(uint _id) onlyAuthorized() returns(address) {
    return offeringCompanies[_id];
  }

  function getLOCCount () onlyAuthorized() returns(uint) {
      return offeringCompaniesByIndex;
  }

  function ChronoMint(address _tc, address _rc, address _ec, address _pc){
    contracts[uint(Setting.timeContract)] = _tc;
    contracts[uint(Setting.rewardsContract)] = _rc;
    contracts[uint(Setting.exchangeContract)] = _ec;
    contracts[uint(Setting.proxyContract)] = _pc;
    values[uint(Setting.securityPercentage)] = 1;
    values[uint(Setting.liquidityPercentage)] = 1;
    values[uint(Setting.insurancePercentage)] = 1;
    values[uint(Setting.insuranceDuration)] = 1;
  }

  function()
  {
    throw;
  }
}

