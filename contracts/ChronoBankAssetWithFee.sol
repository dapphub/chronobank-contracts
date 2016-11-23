pragma solidity ^0.4.4;

import "ChronoBankAsset.sol";

contract ChronoBankAssetWithFee is ChronoBankAsset {
    address public feeAddress;

    modifier takeFee(address _from, uint _fromValue) {
        if (_transferFee(_from, _fromValue)) {
            _;
        }
    }

    function setupFee(address _feeAddress) onlyContractOwner() returns(bool) {
        feeAddress = _feeAddress;
        return true;
    }

    function _transferWithReference(address _to, uint _value, string _reference) takeFee(msg.sender, _value) internal returns(bool) {
        if (!super._transferWithReference(_to, _value, _reference)) {
            _returnFee(msg.sender, _value);
            return false;
        }
        return true;
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference) takeFee(_from, _value) internal returns(bool) {
        if (!super._transferFromWithReference(_from, _to, _value, _reference)) {
            _returnFee(_from, _value);
            return false;
        }
        return true;
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
