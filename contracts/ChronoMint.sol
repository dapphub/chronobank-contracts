pragma solidity ^0.4.4;

import "Managed.sol";
import "ChronoMintConfigurable.sol";
import "LOC.sol";
import "StringLib.sol";

contract ChronoMint is Managed {
  using StringLib for StringLib;

  uint private offeringCompaniesByIndex;
  mapping(uint => address) public offeringCompanies;
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

  function setAddress(uint name, address value) onlyAuthorized {
    contracts[name] = value;
  }

  function setValue(Setting name, string value) onlyAuthorized() {
    setVal(uint(name),value);
  }

  function proposeLOC (string _name, address _controller, uint _issueLimit, string _publishedHash, uint _expDate) execute(Operations.createLOC) returns(address) {
    address locAddr = new LOC(_name,msg.sender,_controller,_issueLimit,_publishedHash,_expDate);
    offeringCompanies[offeringCompaniesByIndex] = locAddr;
    LOC loc = LOC(locAddr);
    //loc.setStatus(1);
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

  function ChronoMint(address _tc, address _rc, address _ec, address _pc){
    contracts[uint(Setting.timeContract)] = _tc;
    contracts[uint(Setting.rewardsContract)] = _rc;
    contracts[uint(Setting.exchangeContract)] = _ec;
    contracts[uint(Setting.proxyContract)] = _pc;
    settings[uint(Setting.securityPercentage)] = bytes32ToString(StringLib.uintToBytes(1));
    settings[uint(Setting.liquidityPercentage)] = bytes32ToString(StringLib.uintToBytes(1));
    settings[uint(Setting.insurancePercentage)] = bytes32ToString(StringLib.uintToBytes(1));
    settings[uint(Setting.insuranceDuration)] = bytes32ToString(StringLib.uintToBytes(1));
  }

  function()
  {
    throw;
  }
}

