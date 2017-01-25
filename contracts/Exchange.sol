pragma solidity ^0.4.4;

import "Owned.sol";
import {ERC20Interface as Asset} from "ERC20Interface.sol";

/**
 * @title ERC20-Ether exchange contract.
 *
 * Users are able to buy/sell assigned ERC20 token for ether, as long as there is available
 * supply. Contract owner maintains sufficient token and ether supply, and sets buy/sell prices.
 *
 * In order to be able to sell tokens, user needs to create allowance for this contract, using
 * standard ERC20 approve() function, so that exchange can take tokens from the user, when user
 * orders a sell.
 *
 * Note: all the non constant functions return false instead of throwing in case if state change
 * didn't happen yet.
 */
contract Exchange is Owned {
    // Assigned ERC20 token.
    Asset public asset;

    // Price in wei at which exchange buys tokens.
    uint public buyPrice = 1;

    // Price in wei at which exchange sells tokens.
    uint public sellPrice = 2;

    // User sold tokens and received wei.
    event Sell(address indexed who, uint token, uint eth);

    // User bought tokens and payed wei.
    event Buy(address indexed who, uint token, uint eth);
    event WithdrawTokens(address indexed recipient, uint amount);
    event WithdrawEth(address indexed recipient, uint amount);
    event Error(bytes32 message);

    /**
     * Assigns ERC20 token for exchange.
     *
     * Can be set only once, and only by contract owner.
     *
     * @param _asset ERC20 token address.
     *
     * @return success.
     */
    function init(Asset _asset) onlyContractOwner() returns(bool) {
        if (address(asset) != 0x0) {
            return false;
        }
        asset = _asset;
        return true;
    }

    /**
     * Set exchange operation prices.
     * Sell price cannot be less than buy price.
     *
     * Can be set only by contract owner.
     *
     * @param _buyPrice price in wei at which exchange buys tokens.
     * @param _sellPrice price in wei at which exchange sells tokens.
     *
     * @return success.
     */
    function setPrices(uint _buyPrice, uint _sellPrice) onlyContractOwner() returns(bool) {
        if (_sellPrice < _buyPrice) {
            Error("Incorrect price");
            return false;
        }
        buyPrice = _buyPrice;
        sellPrice = _sellPrice;
        return true;
    }

    /**
     * Returns assigned token address balance.
     *
     * @param _address address to get balance.
     *
     * @return token balance.
     */
    function _balanceOf(address _address) constant internal returns(uint) {
        return asset.balanceOf(_address);
    }

    /**
     * Sell tokens for ether at specified price. Tokens are taken from caller
     * though an allowance logic.
     * Amount should be less than or equal to current allowance value.
     * Price should be less than or equal to current exchange buyPrice.
     *
     * @param _amount amount of tokens to sell.
     * @param _price price in wei at which sell will happen.
     *
     * @return success.
     */
    function sell(uint _amount, uint _price) returns(bool) {
        if (_price > buyPrice) {
            Error("Price is too high");
            return false;
        }
        if (_balanceOf(msg.sender) < _amount) {
            Error("Insufficient token balance");
            return false;
        }

        uint total = _mul(_amount, _price);
        if (this.balance < total) {
            Error("Insufficient ether supply");
            return false;
        }
        if (!asset.transferFrom(msg.sender, this, _amount)) {
            Error("Payment failed");
            return false;
        }
        if (!msg.sender.send(total)) {
            throw;
        }

        Sell(msg.sender, _amount, total);
        return true;
    }

    /**
     * Buy tokens for ether at specified price. Payment needs to be sent along
     * with the call, and should equal amount * price.
     * Price should be greater than or equal to current exchange sellPrice.
     *
     * @param _amount amount of tokens to buy.
     * @param _price price in wei at which buy will happen.
     *
     * @return success.
     */
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

    /**
     * Transfer specified amount of tokens from exchange to specified address.
     *
     * Can be called only by contract owner.
     *
     * @param _recipient address to transfer tokens to.
     * @param _amount amount of tokens to transfer.
     *
     * @return success.
     */
    function withdrawTokens(address _recipient, uint _amount) onlyContractOwner() returns(bool) {
        if (_balanceOf(this) < _amount) {
            Error("Insufficient token supply");
            return false;
        }
        if (!asset.transfer(_recipient, _amount)) {
            Error("Transfer failed");
            return false;
        }

        WithdrawTokens(_recipient, _amount);
        return true;
    }

    /**
     * Transfer all tokens from exchange to specified address.
     *
     * Can be called only by contract owner.
     *
     * @param _recipient address to transfer tokens to.
     *
     * @return success.
     */
    function withdrawAllTokens(address _recipient) onlyContractOwner() returns(bool) {
        return withdrawTokens(_recipient, _balanceOf(this));
    }

    /**
     * Transfer specified amount of wei from exchange to specified address.
     *
     * Can be called only by contract owner.
     *
     * @param _recipient address to transfer wei to.
     * @param _amount amount of wei to transfer.
     *
     * @return success.
     */
    function withdrawEth(address _recipient, uint _amount) onlyContractOwner() returns(bool) {
        if (this.balance < _amount) {
            Error("Insufficient ether supply");
            return false;
        }
        if (!_recipient.send(_amount)) {
            Error("Transfer failed");
            return false;
        }

        WithdrawEth(_recipient, _amount);
        return true;
    }

    /**
     * Transfer all wei from exchange to specified address.
     *
     * Can be called only by contract owner.
     *
     * @param _recipient address to transfer wei to.
     *
     * @return success.
     */
    function withdrawAllEth(address _recipient) onlyContractOwner() returns(bool) {
        return withdrawEth(_recipient, this.balance);
    }

    /**
     * Transfer all tokens and wei from exchange to specified address.
     *
     * Can be called only by contract owner.
     *
     * @param _recipient address to transfer tokens and wei to.
     *
     * @return success.
     */
    function withdrawAll(address _recipient) onlyContractOwner() returns(bool) {
        if (!withdrawAllTokens(_recipient)) {
            return false;
        }
        if (!withdrawAllEth(_recipient)) {
            throw;
        }
        return true;
    }

    /**
     * Overflow-safe multiplication.
     *
     * Throws in case of value overflow.
     *
     * @param _a first operand.
     * @param _b second operand.
     *
     * @return multiplication result.
     */
    function _mul(uint _a, uint _b) internal constant returns(uint) {
        uint result = _a * _b;
        if (_a != 0 && result / _a != _b) {
            throw;
        }
        return result;
    }

    /**
     * Accept all ether to maintain exchange supply.
     */
    function () payable {}
}
