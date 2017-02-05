pragma solidity ^0.4.4;

contract ChronoBankPlatformInterface {
        function reissueAsset(bytes32 _symbol, uint _value) returns(bool);
}
