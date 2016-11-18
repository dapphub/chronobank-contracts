pragma solidity ^0.4.4;

import "ChronoBankPlatform.sol";

contract ChronoBankAsset is Owned {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approve(address indexed from, address indexed spender, uint value);

    ChronoBankPlatform public chronoBankPlatform;
    bytes32 public symbol;
    string public name;

    function init(address _chronoBankPlatform, bytes32 _symbol, string _name) onlyContractOwner() returns(bool) {
        ChronoBankPlatform ma = ChronoBankPlatform(_chronoBankPlatform);
        if (!ma.isCreated(_symbol)) {
            return false;
        }
        chronoBankPlatform = ma;
        symbol = _symbol;
        name = _name;
        return true;
    }

    modifier onlyChronoBankPlatform() {
        if (msg.sender == address(chronoBankPlatform)) {
            _;
        }
    }

    function totalSupply() constant returns(uint) {
        return chronoBankPlatform.totalSupply(symbol);
    }

    function balanceOf(address _owner) constant returns(uint) {
        return chronoBankPlatform.balanceOf(_owner, symbol);
    }

    function transfer(address _to, uint _value) returns(bool) {
        return _transferWithReference(_to, _value, "");
    }

    function transferWithReference(address _to, uint _value, string _reference) returns(bool) {
        return _transferWithReference(_to, _value, _reference);
    }

    function _transferWithReference(address _to, uint _value, string _reference) internal returns(bool) {
        return chronoBankPlatform.proxyTransferWithReference(_to, _value, symbol, _reference, msg.sender);
    }

    function transferFrom(address _from, address _to, uint _value) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, "");
    }

    function transferFromWithReference(address _from, address _to, uint _value, string _reference) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, _reference);
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference) internal returns(bool) {
        return chronoBankPlatform.proxyTransferFromWithReference(_from, _to, _value, symbol, _reference, msg.sender);
    }

    function emitTransfer(address _from, address _to, uint _value) onlyChronoBankPlatform() {
        Transfer(_from, _to, _value);
    }

    function emitApprove(address _from, address _spender, uint _value) onlyChronoBankPlatform() {
        Approve(_from, _spender, _value);
    }
}
