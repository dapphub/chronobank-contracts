pragma solidity ^0.4.4;

// For testing purposes.
contract FakeCoin {
    mapping(address => uint) public balanceOf;

    function mint(address _to, uint _value) {
        balanceOf[_to] += _value;
    }

    function transfer(address _to, uint _value) returns(bool) {
        return transferFrom(msg.sender, _to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) returns(bool) {
        if (balanceOf[_from] < _value) {
            return false;
        }
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        return true;
    }

    function balanceEth(address _address) constant returns(uint) {
        return _address.balance;
    }
}
