pragma solidity ^0.4.4;

import "ChronoBankAsset.sol";
import "Owned.sol";

/**
 * @title ChronoBank Asset With Fee implementation contract.
 *
 * Asset implementation contract that takes percent fee on top of every transfer.
 * Fee amount is always rounded up.
 *
 * Note: all the non constant functions return false instead of throwing in case if state change
 * didn't happen yet.
 */
contract ChronoBankAssetWithFee is ChronoBankAsset, Owned {
    // Fee collecting address, immutable.
    address public feeAddress;

    // Fee percent, immutable. 1 is 0.01%, 10000 is 100%.
    uint32 public feePercent;

    /**
     * Allows the call if fee was successfully taken, throws if the call failed in the end.
     */
    modifier takeFee(address _from, uint _fromValue, address _sender, bool[1] memory _success) {
        if (_transferFee(_from, _fromValue, _sender)) {
            _;
            if (!_success[0] && _subjectToFees(_from, _fromValue)) {
                throw;
            }
        }
    }

    /**
     * Sets fee collecting address and fee percent.
     *
     * Can be set only once, and only by contract owner.
     *
     * @param _feeAddress fee collecting address.
     * @param _feePercent fee percent, 1 is 0.01%, 10000 is 100%.
     *
     * @return success.
     */
    function setupFee(address _feeAddress, uint32 _feePercent) onlyContractOwner() returns(bool) {
        if (feeAddress != 0x0) {
            return false;
        }
        feeAddress = _feeAddress;
        feePercent = _feePercent;
        return true;
    }

    /**
     * Passes execution into modified function with function-modifier partially shared scope.
     *
     * @return success.
     */
    function _transferWithReference(address _to, uint _value, string _reference, address _sender) internal returns(bool) {
        return _transferWithReference(_to, _value, _reference, _sender, [false]);
    }

    /**
     * Transfers asset balance from the specified sender to specified receiver adding specified comment.
     *
     * Will be executed only in case of successful fee payment from the sender.
     *
     * @param _to holder address to give to.
     * @param _value amount to transfer.
     * @param _reference transfer comment to be included in a platform's Transfer event.
     * @param _sender initial caller.
     * @param _success function-modifier shared scope, so that modifier knows the result of a call.
     *
     * @return success.
     */
    function _transferWithReference(address _to, uint _value, string _reference, address _sender, bool[1] memory _success) takeFee(_sender, _value, _sender, _success) internal returns(bool) {
        _success[0] = super._transferWithReference(_to, _value, _reference, _sender);
        return _success[0];
    }

    /**
     * Passes execution into modified function with function-modifier partially shared scope.
     *
     * @return success.
     */
    function _transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) internal returns(bool) {
        return _transferFromWithReference(_from, _to, _value, _reference, _sender, [false]);
    }

    /**
     * Performs allowance transfer of asset balance from the specified payer to specified receiver
     * adding specified comment.
     *
     * Will be executed only in case of successful fee payment from the payer.
     *
     * @param _from holder address to take from.
     * @param _to holder address to give to.
     * @param _value amount to transfer.
     * @param _reference transfer comment to be included in a platform's Transfer event.
     * @param _sender initial caller.
     * @param _success function-modifier shared scope, so that modifier knows the result of a call.
     *
     * @return success.
     */
    function _transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender, bool[1] memory _success) takeFee(_from, _value, _sender, _success) internal returns(bool) {
        _success[0] = super._transferFromWithReference(_from, _to, _value, _reference, _sender);
        return _success[0];
    }

    /**
     * Transfers fee from the specified payer to fee collecting address.
     *
     * Will be executed only if payer and amount are subjects to fees.
     *
     * @param _feeFrom payer to take fee from.
     * @param _fromValue amount to apply fee percent.
     * @param _sender initial caller.
     *
     * @return success.
     */
    function _transferFee(address _feeFrom, uint _fromValue, address _sender) internal returns(bool) {
        if (!_subjectToFees(_feeFrom, _fromValue)) {
            return true;
        }
        return super._transferFromWithReference(_feeFrom, feeAddress, calculateFee(_fromValue), "Transaction fee", _sender);
    }

    /**
     * Check if specified payer and amount are subjects to fees.
     *
     * Fee is not taken if:
     *  - Fee collecting address is not set;
     *  - Payer is fee collecting address itself;
     *  - Amount equals 0;
     *
     * @return true if fee needs to be taken.
     */
    function _subjectToFees(address _feeFrom, uint _fromValue) internal returns(bool) {
        return feeAddress != 0x0
            && feeAddress != _feeFrom
            && _fromValue != 0;
    }

    /**
     * Return fee that needs to be taken based on specified amount.
     *
     * Fee amount is always rounded up.
     *
     * @return fee amount.
     */
    function calculateFee(uint _value) constant returns(uint) {
        uint feeRaw = _value * feePercent;
        return (feeRaw / 10000) + (feeRaw % 10000 == 0 ? 0 : 1);
    }
}
