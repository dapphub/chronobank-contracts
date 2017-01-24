pragma solidity ^0.4.4;

import "Owned.sol";

/**
 * @title Owned contract with arbitrary call forwarding.
 *
 * Allows an owner to perform any action by the name of this contract.
 *
 * Note: should not be used in contracts that must make calls not controlled by owner.
 */
contract Rooted is Owned {
    /**
     * Perform an arbitrary call.
     *
     * Can only be called by contract owner.
     * Throws if call forwarding failed.
     *
     * @param _to address to call to.
     * @param _value wei value to pass with the call.
     * @param _data bytes data to pass with the call.
     *
     * @return success.
     */
    function forwardCall(address _to, uint _value, bytes _data) onlyContractOwner() returns(bool) {
        if (!_to.call.value(_value)(_data)) {
            throw;
        }
        return true;
    }
}
