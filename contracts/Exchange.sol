pragma solidity ^0.4.4;

import "Owned.sol";
import {ERC20Interface as Asset} from "ERC20Interface.sol";

contract Exchange is Owned {
    Asset public asset;
    uint public buyPrice = 1;
    uint public sellPrice = 2;

    event Sell(address indexed who, uint token, uint eth);
    event Buy(address indexed who, uint token, uint eth);
    event WithdrawTokens(address indexed recipient, uint amount);
    event WithdrawEth(address indexed recipient, uint amount);

    function init(address _asset) onlyContractOwner() returns(bool) {
        if (address(asset) != 0x0) {
            return false;
        }
        asset = Asset(_asset);
        return true;
    }

    function setPrices(uint _buyPrice, uint _sellPrice) onlyContractOwner() returns(bool) {
        if (_sellPrice < _buyPrice) {
            return false;
        }
        buyPrice = _buyPrice;
        sellPrice = _sellPrice;
        return true;
    }

    function _balanceOf(address _address) constant internal returns(uint) {
        return asset.balanceOf(_address);
    }

    function sell(uint _amount, uint _price) returns(bool) {
        if (_price > buyPrice) {
            return false;
        }
        if (_balanceOf(msg.sender) < _amount) {
            return false;
        }

        uint total = _mul(_amount, _price);
        if (this.balance < total) {
            return false;
        }
        if (!asset.transferFrom(msg.sender, this, _amount)) {
            return false;
        }
        if (!msg.sender.send(total)) {
            throw;
        }

        Sell(msg.sender, _amount, total);
        return true;
    }

    function buy(uint _amount, uint _price) payable returns(bool) {
        if (_price < sellPrice) {
            throw;
        }
        if (_balanceOf(this) < _amount) {
            throw;
        }

        uint total = _mul(_amount, _price);
        if (msg.value != total) {
            throw;
        }
        if (!asset.transfer(msg.sender, _amount)) {
            throw;
        }

        Buy(msg.sender, _amount, total);
        return true;
    }

    function withdrawTokens(address _recipient, uint _amount) onlyContractOwner() returns(bool) {
        if (_balanceOf(this) < _amount) {
            return false;
        }
        if (!asset.transfer(_recipient, _amount)) {
            return false;
        }

        WithdrawTokens(_recipient, _amount);
        return true;
    }

    function withdrawAllTokens(address _recipient) onlyContractOwner() returns(bool) {
        return withdrawTokens(_recipient, _balanceOf(this));
    }

    function withdrawEth(address _recipient, uint _amount) onlyContractOwner() returns(bool) {
        if (this.balance < _amount) {
            return false;
        }
        if (!_recipient.send(_amount)) {
            return false;
        }

        WithdrawEth(_recipient, _amount);
        return true;
    }

    function withdrawAllEth(address _recipient) onlyContractOwner() returns(bool) {
        return withdrawEth(_recipient, this.balance);
    }

    function withdrawAll(address _recipient) onlyContractOwner() returns(bool) {
        if (!withdrawAllTokens(_recipient)) {
            return false;
        }
        if (!withdrawAllEth(_recipient)) {
            throw;
        }
        return true;
    }

    function _mul(uint _a, uint _b) internal constant returns(uint) {
        uint result = _a * _b;
        if (_a != 0 && result / _a != _b) {
            throw;
        }
        return result;
    }
    
    function () payable {}
}
