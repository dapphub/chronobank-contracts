pragma solidity ^0.4.4;

import "Configurable.sol";

contract ChronoMintConfigurable is Configurable {
  address chronoMint;

  modifier onlyMint() {
    if (isMint(msg.sender)) {
      _;
      } else {
        return;
      }
  }
  function Configurable() {

  }
  function isMint(address _ad) returns(bool) {
    if (_ad == chronoMint)
      return true;
    else
      return false;
  }

  function setValue(uint name, string value) onlyMint() {
      setVal(name, value);
  }

}
