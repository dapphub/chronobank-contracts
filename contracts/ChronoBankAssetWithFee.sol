pragma solidity 0.4.4;

import "ChronoBankAsset.sol";
import "Owned.sol";

contract ChronoBankAssetWithFee is ChronoBankAsset, Owned {
    address public feeAddress;
    uint constant FEE_PERCENT = 15; // 0.15%

    modifier takeFee(address _from, uint _fromValue, address _sender, bool[1] memory _success) {
        if (_transferFee(_from, _fromValue, _sender)) {
            _;
            if (!_success[0] && _subjectToFees(_from, _fromValue)) {
                throw;
            }
        }
    }

    function setupFee(address _feeAddress) onlyContractOwner() returns(bool) {
        feeAddress = _feeAddress;
        return true;
    }

    function _transferWithReference(address _to, uint _value, string _reference, address _sender) internal returns(bool) {
        return _transferWithReference(_to, _value, _reference, _sender, [false]);
    }

    function _transferWithReference(address _to, uint _value, string _reference, address _sender, bool[1] memory _success) takeFee(_sender, _value, _sender, _success) internal returns(bool) {
        _success[0] = super._transferWithReference(_to, _value, _reference, _sender);
        return _success[0];
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) internal returns(bool) {
        return _transferFromWithReference(_from, _to, _value, _reference, _sender, [false]);
    }

    function _transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender, bool[1] memory _success) takeFee(_from, _value, _sender, _success) internal returns(bool) {
        _success[0] = super._transferFromWithReference(_from, _to, _value, _reference, _sender);
        return _success[0];
    }

    function _transferFee(address _feeFrom, uint _fromValue, address _sender) internal returns(bool) {
        if (!_subjectToFees(_feeFrom, _fromValue)) {
            return true;
        }
        return super._transferFromWithReference(_feeFrom, feeAddress, calculateFee(_fromValue), "Transaction fee", _sender);
    }

    function _subjectToFees(address _feeFrom, uint _fromValue) internal returns(bool) {
        return feeAddress != 0x0
            && feeAddress != _feeFrom
            && _fromValue != 0;
    }

    // Round up.
    function calculateFee(uint _value) constant returns(uint) {
        uint feeRaw = _value * FEE_PERCENT;
        return (feeRaw / 10000) + (feeRaw % 10000 == 0 ? 0 : 1);
    }
}
