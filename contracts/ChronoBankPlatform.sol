pragma solidity ^0.4.4;

import "Owned.sol";

contract Emitter {
    function emitTransfer(address _from, address _to, bytes32 _symbol, uint _value, string _reference);
    function emitIssue(bytes32 _symbol, uint _value, address _by);
    function emitRevoke(bytes32 _symbol, uint _value, address _by);
    function emitOwnershipChange(address _from, address _to, bytes32 _symbol);
    function emitApprove(address _from, address _spender, bytes32 _symbol, uint _value);
    function emitError(bytes32 _message);
}

contract Proxy {
    function emitTransfer(address _from, address _to, uint _value);
    function emitApprove(address _from, address _spender, uint _value);
}

contract ChronoBankPlatform is Owned {
    struct Asset {
        uint owner;
        uint totalSupply;
        string name;
        string description;
        bool isReissuable;
        uint8 baseUnit;
        mapping(uint => Wallet) wallets;
    }

    struct ProxyConf {
        address proxy;
        mapping(address => bool) isProxy;
    }

    struct Wallet {
        uint balance;
        mapping(uint => uint) allowance;
    }

    struct Holder {
        address addr;
    }

    // Iterable mapping pattern is used for holders.
    uint public holdersCount;
    mapping(uint => Holder) public holders;
    // This is access address mapping. Many addresses may have access to a single holder.
    mapping(address => uint) holderIndex;
    mapping(bytes32 => Asset) public assets;
    mapping(bytes32 => ProxyConf) public proxies;

    // Should use interface of the emitter, but address of events history.
    Emitter public eventsHistory;

    function _error(bytes32 _message) internal {
        eventsHistory.emitError(_message);
    }

    function setupEventsHistory(address _eventsHistory) onlyContractOwner() returns(bool) {
        if (address(eventsHistory) != 0) {
            return false;
        }
        eventsHistory = Emitter(_eventsHistory);
        return true;
    }

    modifier onlyOwner(bytes32 _symbol) {
        if (isOwner(msg.sender, _symbol)) {
            _;
        } else {
            _error("Only owner: access denied");
        }
    }

    modifier onlyProxy(bytes32 _symbol) {
        if (proxies[_symbol].isProxy[msg.sender]) {
            _;
        } else {
            _error("Only proxy: access denied");
        }
    }

    function isCreated(bytes32 _symbol) constant returns(bool) {
        return assets[_symbol].owner != 0;
    }

    function baseUnit(bytes32 _symbol) constant returns(uint8) {
        return assets[_symbol].baseUnit;
    }

    function name(bytes32 _symbol) constant returns(string) {
        return assets[_symbol].name;
    }

    function description(bytes32 _symbol) constant returns(string) {
        return assets[_symbol].description;
    }

    function isReissuable(bytes32 _symbol) constant returns(bool) {
        return assets[_symbol].isReissuable;
    }

    function owner(bytes32 _symbol) constant returns(address) {
        return holders[assets[_symbol].owner].addr;
    }

    function isOwner(address _owner, bytes32 _symbol) constant returns(bool) {
        return isCreated(_symbol) && (assets[_symbol].owner == getHolderId(_owner));
    }

    function totalSupply(bytes32 _symbol) constant returns(uint) {
        return assets[_symbol].totalSupply;
    }

    function balanceOf(address _holder, bytes32 _symbol) constant returns(uint) {
        return _balanceOf(getHolderId(_holder), _symbol);
    }

    function _balanceOf(uint _holderId, bytes32 _symbol) constant internal returns(uint) {
        return assets[_symbol].wallets[_holderId].balance;
    }

    function _address(uint _holderId) constant internal returns(address) {
        return holders[_holderId].addr;
    }

    function setProxy(address _address, bool enabled, bytes32 _symbol) onlyContractOwner() returns(bool) {
        proxies[_symbol].isProxy[_address] = enabled;
        return true;
    }

    function setEventsProxy(address _address, bytes32 _symbol) onlyContractOwner() returns(bool) {
        proxies[_symbol].proxy = _address;
        return true;
    }

    function _transferDirect(uint _fromId, uint _toId, uint _value, bytes32 _symbol) internal {
        assets[_symbol].wallets[_fromId].balance -= _value;
        assets[_symbol].wallets[_toId].balance += _value;
    }

    function _transfer(uint _fromId, uint _toId, uint _value, bytes32 _symbol, string _reference, uint _senderId) internal returns(bool) {
        if (_fromId == _toId) {
            _error("Cannot send to oneself");
            return false;
        }
        if (_value == 0) {
            _error("Cannot send 0 value");
            return false;
        }
        if (_balanceOf(_fromId, _symbol) < _value) {
            _error("Insufficient balance");
            return false;
        }
        if (_fromId != _senderId && _allowance(_fromId, _senderId, _symbol) < _value) {
            _error("Not enough allowance");
            return false;
        }
        _transferDirect(_fromId, _toId, _value, _symbol);
        if (_fromId != _senderId) {
            assets[_symbol].wallets[_fromId].allowance[_senderId] -= _value;
        }
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitTransfer(_address(_fromId), _address(_toId), _symbol, _value, _reference);
        _proxyTransferEvent(_fromId, _toId, _value, _symbol);
        return true;
    }

    // this function will fail unless isProxy[msg.sender] == true
    function proxyTransferWithReference(address _to, uint _value, bytes32 _symbol, string _reference, address _sender) onlyProxy(_symbol) returns(bool) {
        return _transfer(getHolderId(_sender), _createHolderId(_to), _value, _symbol, _reference, getHolderId(_sender));
    }

    function _proxyTransferEvent(uint _fromId, uint _toId, uint _value, bytes32 _symbol) internal {
        ProxyConf conf = proxies[_symbol];
        if (conf.proxy != 0x0) {
            // Internal Out Of Gas/Throw: revert this transaction too;
            // Call Stack Depth Limit reached: n/a after HF 4;
            // Recursive Call: safe, all changes already made.
            Proxy(conf.proxy).emitTransfer(_address(_fromId), _address(_toId), _value);
        }
    }

    function getHolderId(address _holder) constant returns(uint) {
        return holderIndex[_holder];
    }

    function _createHolderId(address _holder) internal returns(uint) {
        uint holderId = holderIndex[_holder];
        if (holderId == 0) {
            holderId = ++holdersCount;
            holders[holderId].addr = _holder;
            holderIndex[_holder] = holderId;
        }
        return holderId;
    }

    function issueAsset(bytes32 _symbol, uint _value, string _name, string _description, uint8 _baseUnit, bool _isReissuable) onlyContractOwner() returns(bool) {
        if (_value == 0 && !_isReissuable) {
            _error("Cannot issue 0 value fixed asset");
            return false;
        }
        if (isCreated(_symbol)) {
            _error("Asset already issued");
            return false;
        }
        uint holderId = _createHolderId(msg.sender);

        assets[_symbol] = Asset(holderId, _value, _name, _description, _isReissuable, _baseUnit);
        assets[_symbol].wallets[holderId].balance = _value;
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitIssue(_symbol, _value, _address(holderId));
        return true;
    }

    function reissueAsset(bytes32 _symbol, uint _value) onlyOwner(_symbol) returns(bool) {
        if (_value == 0) {
            _error("Cannot reissue 0 value");
            return false;
        }
        Asset asset = assets[_symbol];
        if (!asset.isReissuable) {
            _error("Cannot reissue fixed asset");
            return false;
        }
        if (asset.totalSupply + _value < asset.totalSupply) {
            _error("Total supply overflow");
            return false;
        }
        uint holderId = getHolderId(msg.sender);
        asset.wallets[holderId].balance += _value;
        asset.totalSupply += _value;
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitIssue(_symbol, _value, _address(holderId));
        _proxyTransferEvent(0, holderId, _value, _symbol);
        return true;
    }

    function revokeAsset(bytes32 _symbol, uint _value) returns(bool) {
        if (_value == 0) {
            _error("Cannot revoke 0 value");
            return false;
        }
        Asset asset = assets[_symbol];
        uint holderId = getHolderId(msg.sender);
        if (asset.wallets[holderId].balance < _value) {
            _error("Not enough tokens to revoke");
            return false;
        }
        asset.wallets[holderId].balance -= _value;
        asset.totalSupply -= _value;
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitRevoke(_symbol, _value, _address(holderId));
        _proxyTransferEvent(holderId, 0, _value, _symbol);
        return true;
    }

    function changeOwnership(bytes32 _symbol, address _newOwner) onlyOwner(_symbol) returns(bool) {
        Asset asset = assets[_symbol];
        uint newOwnerId = _createHolderId(_newOwner);
        if (asset.owner == newOwnerId) {
            _error("Cannot pass ownership to oneself");
            return false;
        }
        address oldOwner = _address(asset.owner);
        asset.owner = newOwnerId;
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitOwnershipChange(oldOwner, _address(newOwnerId), _symbol);
        return true;
    }

    function _approve(uint _spenderId, uint _value, bytes32 _symbol, uint _senderId) internal returns(bool) {
        if (!isCreated(_symbol)) {
            _error("Asset is not issued");
            return false;
        }
        if (_senderId == _spenderId) {
            _error("Cannot approve to oneself");
            return false;
        }
        assets[_symbol].wallets[_senderId].allowance[_spenderId] = _value;
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: revert this transaction too;
        // Recursive Call: safe, all changes already made.
        eventsHistory.emitApprove(_address(_senderId), _address(_spenderId), _symbol, _value);
        ProxyConf conf = proxies[_symbol];
        if (conf.proxy != 0x0) {
            // Internal Out Of Gas/Throw: revert this transaction too;
            // Call Stack Depth Limit reached: n/a after HF 4;
            // Recursive Call: safe, all changes already made.
            Proxy(conf.proxy).emitApprove(_address(_senderId), _address(_spenderId), _value);
        }
        return true;
    }

    function approve(address _spender, uint _value, bytes32 _symbol) returns(bool) {
        return _approve(_createHolderId(_spender), _value, _symbol, _createHolderId(msg.sender));
    }

    function proxyApprove(address _spender, uint _value, bytes32 _symbol, address _sender) onlyProxy(_symbol) returns(bool) {
        return _approve(_createHolderId(_spender), _value, _symbol, _createHolderId(_sender));
    }

    function allowance(address _from, address _spender, bytes32 _symbol) constant returns(uint) {
        return _allowance(getHolderId(_from), getHolderId(_spender), _symbol);
    }

    function _allowance(uint _fromId, uint _toId, bytes32 _symbol) constant internal returns(uint) {
        return assets[_symbol].wallets[_fromId].allowance[_toId];
    }

    function proxyTransferFromWithReference(address _from, address _to, uint _value, bytes32 _symbol, string _reference, address _sender) onlyProxy(_symbol) returns(bool) {
        return _transfer(getHolderId(_from), _createHolderId(_to), _value, _symbol, _reference, getHolderId(_sender));
    }
}