pragma solidity ^0.4.4;

import "ChronoBankPlatform.sol";
import {ChronoBankAssetInterface as ChronoBankAsset} from "ChronoBankAssetInterface.sol";

contract ChronoBankAssetProxy {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approve(address indexed from, address indexed spender, uint value);

    ChronoBankPlatform public chronoBankPlatform;
    bytes32 public symbol;
    string public name;

    function init(address _chronoBankPlatform, bytes32 _symbol, string _name) returns(bool) {
        if (address(chronoBankPlatform) != 0x0) {
            return false;
        }
        chronoBankPlatform = ChronoBankPlatform(_chronoBankPlatform);
        symbol = _symbol;
        name = _name;
        return true;
    }

    modifier onlyChronoBankPlatform() {
        if (msg.sender == address(chronoBankPlatform)) {
            _;
        }
    }

    modifier onlyAssetOwner() {
        if (chronoBankPlatform.isOwner(msg.sender, symbol)) {
            _;
        }
    }

    function _getAsset() internal returns(ChronoBankAsset) {
        return ChronoBankAsset(getVersionFor(msg.sender));
    }

    function totalSupply() constant returns(uint) {
        return chronoBankPlatform.totalSupply(symbol);
    }

    function balanceOf(address _owner) constant returns(uint) {
        return chronoBankPlatform.balanceOf(_owner, symbol);
    }

    function allowance(address _from, address _spender) constant returns(uint) {
        return chronoBankPlatform.allowance(_from, _spender, symbol);
    }

    function decimals() constant returns(uint8) {
        return chronoBankPlatform.baseUnit(symbol);
    }

    function transfer(address _to, uint _value) returns(bool) {
        return _transferWithReference(_to, _value, "");
    }

    function transferWithReference(address _to, uint _value, string _reference) returns(bool) {
        return _transferWithReference(_to, _value, _reference);
    }

    function _transferWithReference(address _to, uint _value, string _reference) internal returns(bool) {
        return _getAsset().__transferWithReference(_to, _value, _reference, msg.sender);
    }

    function __transferWithReference(address _to, uint _value, string _reference, address _sender) onlyAccess(_sender) returns(bool) {
        return chronoBankPlatform.proxyTransferWithReference(_to, _value, symbol, _reference, _sender);
    }

    function transferFrom(address _from, address _to, uint _value) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, "");
    }

    function transferFromWithReference(address _from, address _to, uint _value, string _reference) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, _reference);
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference) internal returns(bool) {
        return _getAsset().__transferFromWithReference(_from, _to, _value, _reference, msg.sender);
    }

    function __transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) onlyAccess(_sender) returns(bool) {
        return chronoBankPlatform.proxyTransferFromWithReference(_from, _to, _value, symbol, _reference, _sender);
    }

    function approve(address _spender, uint _value) returns(bool) {
        return _approve(_spender, _value);
    }

    function _approve(address _spender, uint _value) internal returns(bool) {
        return _getAsset().__approve(_spender, _value, msg.sender);
    }

    function __approve(address _spender, uint _value, address _sender) onlyAccess(_sender) returns(bool) {
        return chronoBankPlatform.proxyApprove(_spender, _value, symbol, _sender);
    }

    function emitTransfer(address _from, address _to, uint _value) onlyChronoBankPlatform() {
        Transfer(_from, _to, _value);
    }

    function emitApprove(address _from, address _spender, uint _value) onlyChronoBankPlatform() {
        Approve(_from, _spender, _value);
    }

    function () payable {
        _getAsset().__process.value(msg.value)(msg.data, msg.sender);
    }

    event UpgradeProposal(address newVersion);

    address latestVersion;
    address pendingVersion;
    uint pendingVersionTimestamp;
    uint constant UPGRADE_FREEZE_TIME = 3 days;
    mapping(address => address) userOptOutVersion;

    modifier onlyAccess(address _sender) {
        if (getVersionFor(_sender) == msg.sender) {
            _;
        }
    }

    function getVersionFor(address _sender) constant returns(address) {
        return userOptOutVersion[_sender] == 0 ? latestVersion : userOptOutVersion[_sender];
    }

    function getLatestVersion() constant returns(address) {
        return latestVersion;
    }

    function getPendingVersion() constant returns(address) {
        return pendingVersion;
    }

    function getPendingVersionTimestamp() constant returns(uint) {
        return pendingVersionTimestamp;
    }

    function proposeUpgrade(address _newVersion) onlyAssetOwner() returns(bool) {
        if (pendingVersion != 0x0) {
            return false;
        }
        if (_newVersion == 0x0) {
            return false;
        }
        if (latestVersion == 0x0) {
            latestVersion = _newVersion;
            return true;
        }
        pendingVersion = _newVersion;
        pendingVersionTimestamp = now;
        UpgradeProposal(_newVersion);
        return true;
    }

    function purgeUpgrade() onlyAssetOwner() returns(bool) {
        if (pendingVersion == 0x0) {
            return false;
        }
        delete pendingVersion;
        delete pendingVersionTimestamp;
        return true;
    }

    function commitUpgrade() returns(bool) {
        if (pendingVersion == 0x0) {
            return false;
        }
        if (pendingVersionTimestamp + UPGRADE_FREEZE_TIME > now) {
            return false;
        }
        latestVersion = pendingVersion;
        delete pendingVersion;
        delete pendingVersionTimestamp;
        return true;
    }

    function optOut() returns(bool) {
        if (userOptOutVersion[msg.sender] != 0x0) {
            return false;
        }
        userOptOutVersion[msg.sender] = latestVersion;
        return true;
    }

    function optIn() returns(bool) {
        delete userOptOutVersion[msg.sender];
        return true;
    }
}
