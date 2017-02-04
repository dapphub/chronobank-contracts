pragma solidity ^0.4.4;

import "Managed.sol";
import "LOC.sol";
import "ChronoBankPlatformInterface.sol";
import "ERC20Interface.sol";

contract ChronoMint is Managed {
  uint private offeringCompaniesByIndex;
  address platform;
  mapping(uint => address) internal offeringCompanies;
  event newLOC(address _from, address _LOC);
  
  function claimOwnership(address _addr) onlyAuthorized() returns(bool) {
     if(Owned(_addr).claimContractOwnership()) {
       platform = _addr;
       return true;
     }
     return false;
  }

  function issueAsset(bytes32 _symbol, uint _value, string _name, string _description, uint8 _baseUnit, bool _isReissuable) onlyAuthorized() returns(bool) {
     if(platform != 0x0) {
     	return ChronoBankPlatformInterface(platform).issueAsset(_symbol, _value, _name, _description, _baseUnit, _isReissuable);
     }
     return false;
  }

  function reissueAsset(bytes32 _symbol, uint _value) onlyAuthorized() returns(bool) {
     if(platform != 0x0) {
        return ChronoBankPlatformInterface(platform).reissueAsset(_symbol, _value);
     }
     return false;
  }


  function getBalance(uint _name) onlyAuthorized() returns(uint) {
     return ERC20Interface(contracts[_name]).totalSupply();

  }

  function getAddress(uint name) constant returns(address) {
    return contracts[name];
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

  function ChronoMint(address _eS, address _tpc, address _rc, address _ec, address _lhpc) {
    eternalStorage = _eS;
    contracts[uint(Setting.timeProxyContract)] = _tpc;
    contracts[uint(Setting.rewardsContract)] = _rc;
    contracts[uint(Setting.exchangeContract)] = _ec;
    contracts[uint(Setting.lhProxyContract)] = _lhpc;
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

