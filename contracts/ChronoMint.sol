pragma solidity ^0.4.4;

import "Managed.sol";
import "LOC.sol";

contract ChronoMint is Managed {

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

  function getValue(uint name) constant returns(string) {
    return settings[name];
  }

  function setAddress(uint name, address value) execute(Operations.editMint) {
    contracts[name] = value;
  }

  function addLOC (address _locAddr) execute(Operations.addLOC) {
    offeringCompanies[offeringCompaniesByIndex] = _locAddr;
    offeringCompaniesByIndex++;
  }

  function removeLOC(address _locAddr) execute(Operations.removeLOC) {
    delete offeringCompanies[offeringCompaniesByIndex];
    offeringCompaniesByIndex--;
  }

  function proposeLOC(string _name, address _controller, uint _issueLimit, string _publishedHash, uint _expDate) execute(Operations.createLOC) returns(address) {
    address locAddr = new LOC(_name,msg.sender,_controller,_issueLimit,_publishedHash,_expDate);
    offeringCompanies[offeringCompaniesByIndex] = locAddr;
    LOC loc = LOC(locAddr);
    loc.setStatus(Status.active);
    newLOC(msg.sender, locAddr);
    offeringCompaniesByIndex++;
    return locAddr;
  }

  function setLOCStatus(uint _LOCid, Status status) execute(Operations.editLOC) {
     LOC(offeringCompanies[_LOCid]).setStatus(status);
  }

  function setLOCValue(uint _LOCid, Setting name, string value) onlyAuthorized() {
    LOC(offeringCompanies[_LOCid]).setValue(uint(name),value);
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

