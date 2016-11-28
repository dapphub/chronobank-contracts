pragma solidity ^0.4.4;

import "ChronoBankAsset.sol";

contract ChronoBankAssetWithFee is ChronoBankAsset {
    address public feeAddress;

    modifier takeFee(address _from, uint _fromValue, bool[1] memory _success) {
        if (_transferFee(_from, _fromValue)) {
            _;
            if (!_success[0]) {
                _returnFee(msg.sender, _fromValue);
            }
        }
    }

    function setupFee(address _feeAddress) onlyContractOwner() returns(bool) {
        feeAddress = _feeAddress;
        return true;
    }

    function transfer(address _to, uint _value) returns(bool) {
        return _transferWithReference(_to, _value, "", [false]);
    }

    function transferWithReference(address _to, uint _value, string _reference) returns(bool) {
        return _transferWithReference(_to, _value, _reference, [false]);
    }

    function _transferWithReference(address _to, uint _value, string _reference, bool[1] memory _success) takeFee(msg.sender, _value, _success) internal returns(bool) {
        _success[0] = super._transferWithReference(_to, _value, _reference);
        return _success[0];
    }

    function transferFrom(address _from, address _to, uint _value) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, "", [false]);
    }

    function transferFromWithReference(address _from, address _to, uint _value, string _reference) returns(bool) {
        return _transferFromWithReference(_from, _to, _value, _reference, [false]);
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference, bool[1] memory _success) takeFee(_from, _value, _success) internal returns(bool) {
        _success[0] = super._transferFromWithReference(_from, _to, _value, _reference);
        return _success[0];
    }

    function _transferFee(address _feeFrom, uint _fromValue) internal returns(bool) {
        if (feeAddress == 0x0 || feeAddress == _feeFrom || _fromValue == 0) {
            return true;
        }
        return chronoBankPlatform.proxyTransferFromWithReference(_feeFrom, feeAddress, calculateFee(_fromValue), symbol, "Transaction fee", msg.sender);
    }

    function _returnFee(address _to, uint _fromValue) internal {
        if (feeAddress == 0x0 || feeAddress == _to || _fromValue == 0) {
            return;
        }
        if (!chronoBankPlatform.proxyTransferWithReference(_to, calculateFee(_fromValue), symbol, "Transaction fee return", feeAddress)) {
            throw;
        }
    }

    // 0.15% fee, round up.
    function calculateFee(uint _value) constant returns(uint) {
        uint feeRaw = _value * 15;
        return (feeRaw / 10000) + (feeRaw % 10000 == 0 ? 0 : 1);
    }
}
