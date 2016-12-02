pragma solidity 0.4.4;

import "Owned.sol";

contract Rooted is Owned {
    // Root previleges.
    function forwardCall(address _to, uint _value, bytes _data) onlyContractOwner() returns(bool) {
        if (!_to.call.value(_value)(_data)) {
            throw;
        }
        return true;
    }
}