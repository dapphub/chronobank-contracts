pragma solidity ^0.4.4;

contract ChronoBankPlatformInterface {
	function issueAsset(bytes32 _symbol, uint _value, string _name, string _description, uint8 _baseUnit, bool _isReissuable) returns(bool); 
        function reissueAsset(bytes32 _symbol, uint _value) returns(bool);
}
