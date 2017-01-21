pragma solidity ^0.4.4;

import "Managed.sol";
import "ChronoMintConfigurable.sol";
import "Stub.sol";
import "LOC.sol";

contract ChronoMint is Managed {
  uint private offeringCompaniesByIndex;
  mapping(uint => address) public offeringCompanies;
  event newLOC(address _from, address _LOC);

  function getAddress(uint name) constant returns(address) {
    return contracts[name];
  }

  function isCBE(address key) returns(bool) {
      if (authorizedKeys[key]){
        return true;
      }
      else
        return false;
  }
  function getValue(uint name) constant returns(string) {
    return settings[name];
  }

  function setAddress(uint name, address value) onlyAuthorized {
    contracts[name] = value;
  }

  function setValue(Setting name, string value) onlyAuthorized() {
    setVal(uint(name),value);
  }

  function proposeLOC (string _name, address _controller, uint _issueLimit, string _publishedHash, uint _expDate) onlyAuthorized returns(address) {
    address locAddr = new LOC();
    offeringCompanies[offeringCompaniesByIndex] = locAddr;
    LOC loc = LOC(locAddr);
    loc.setLOCdata(_name,msg.sender,_controller,_issueLimit,_publishedHash,_expDate);
    approveContract(locAddr);
    newLOC(msg.sender, locAddr);
    offeringCompaniesByIndex++;
    return locAddr;
  }

  function getLOCbyID(uint _id) onlyAuthorized() returns(address) {
    return offeringCompanies[_id];
  }

  function getLOCCount () onlyAuthorized() returns(uint) {
      return offeringCompaniesByIndex;
  }

  function approveContract(address newContract) onlyAuthorized() {
    ChronoMintConfigurable(newContract).approved();
  }

  function ChronoMint(address _tc, address _rc, address _ec, address _pc){
    contracts[uint(Setting.timeContract)] = _tc;
    contracts[uint(Setting.rewardsContract)] = _rc;
    contracts[uint(Setting.exchangeContract)] = _ec;
    contracts[uint(Setting.proxyContract)] = _pc;
    settings[uint(Setting.securityPercentage)] = bytes32ToString(bytes32(1));
    settings[uint(Setting.liquidityPercentage)] = bytes32ToString(bytes32(1));
    settings[uint(Setting.insurancePercentage)] = bytes32ToString(bytes32(1));
    settings[uint(Setting.insuranceDuration)] = bytes32ToString(bytes32(1));
  }

  function()
  {
    throw;
  }
}

