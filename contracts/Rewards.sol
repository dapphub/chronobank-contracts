pragma solidity 0.4.4;

import {ERC20Interface as Asset} from "ERC20Interface.sol";

contract Rewards {
    struct Period {
        uint startDate;
        uint closeBlockNumber;
        uint totalShares;
        mapping(address => uint) assetBalances;
        mapping(address => uint) shares;
        mapping(address => mapping(address => bool)) calculated;
    }

    Asset public sharesContract;
    uint public closeInterval;
    mapping(address => uint) public shares;
    mapping(address => mapping(address => uint)) rewards;
    mapping(address => uint) public rewardsLeft;
    Period[] periods;

    // indexed amount for checking 0 deposit
    event Deposit(address indexed who, uint indexed amount, uint indexed period);
    event PeriodClosed();
    event AssetRegistration(address indexed assetAddress, uint balance);
    event CalculateReward(address indexed assetAddress, address indexed who, uint reward);
    event WithdrawReward(address indexed assetAddress, address indexed who, uint amount);
    event WithdrawShares(address indexed who, uint amount);
    event Error(bytes32 message);

    function init(address _sharesContract, uint _closeIntervalDays) returns(bool) {
        // only once
        if (periods.length > 0) {
            return false;
        }

        sharesContract = Asset(_sharesContract);
        closeInterval = _closeIntervalDays;
        periods.length++;
        periods[0].startDate = now;

        return true;
    }


    // functions
    function deposit(uint _amount) returns(bool) {
        return depositFor(msg.sender, _amount);
    }

    function depositFor(address _address, uint _amount) returns(bool) {
        // try to transfer shares to contract
        if (_amount != 0 && !sharesContract.transferFrom(msg.sender, this, _amount)) {
            Error("Shares transfer failed");
            return false;
        }

        shares[_address] += _amount;

        // add deposit to last unclosed Period
        Period period = periods[lastPeriod()];
        if (period.shares[_address] == 0) {
            period.totalShares += shares[_address];
        }
        else {
            period.totalShares += _amount;
        }
        period.shares[_address] = shares[_address];

        Deposit(_address, _amount, lastPeriod());
        return true;
    }

    function closePeriod() returns(bool) {
        // get last period and close it, set vars and create new period
        // this can be done only once per period
        Period period = periods[lastPeriod()];
        if ((period.startDate + (closeInterval * 1 days)) > now) {
            Error("Cannot close period yet");
            return false;
        }

        period.closeBlockNumber = block.number;

        // add new empty period
        periods.length++;
        periods[lastPeriod()].startDate = now;

        PeriodClosed();
        return true;
    }

    function registerAsset(address _assetAddress) returns(bool) {
        Period period = periods[lastClosedPeriod()];
        if (period.assetBalances[_assetAddress] != 0) {
            Error("Asset is already registered");
            return false;
        }

        period.assetBalances[_assetAddress] = Asset(_assetAddress).balanceOf(this) - rewardsLeft[_assetAddress];
        rewardsLeft[_assetAddress] += period.assetBalances[_assetAddress];

        AssetRegistration(_assetAddress, period.assetBalances[_assetAddress]);
        return true;
    }

    function calculateReward(address _assetAddress) returns(bool) {
        return calculateRewardForAddressAndPeriod(_assetAddress, msg.sender, lastClosedPeriod());
    }

    function calculateRewardFor(address _assetAddress, address _address) returns(bool) {
        return calculateRewardForAddressAndPeriod(_assetAddress, _address, lastClosedPeriod());
    }

    function calculateRewardForPeriod(address _assetAddress, uint _period) returns(bool) {
        return calculateRewardForAddressAndPeriod(_assetAddress, msg.sender, _period);
    }

    function calculateRewardForAddressAndPeriod(address _assetAddress, address _address, uint _period) returns(bool) {
        // calculate user reward if not calculated
        Period period = periods[_period];
        if (!isClosed(_period) || period.assetBalances[_assetAddress] == 0) {
            Error("Reward calculation failed");
            return false;
        }

        if (period.calculated[_assetAddress][_address]) {
            Error("Reward is already calculated");
            return false;
        }

        uint reward = period.assetBalances[_assetAddress] * period.shares[_address] / period.totalShares;
        rewards[_assetAddress][_address] += reward;
        period.calculated[_assetAddress][_address] = true;

        CalculateReward(_assetAddress, _address, reward);
        return true;
    }

    function withdrawShares(uint _amount) returns(bool) {
        deposit(0);
        if (_amount > shares[msg.sender]) {
            Error("Insufficient balance");
            return false;
        }

        shares[msg.sender] -= _amount;

        Period period = periods[lastPeriod()];
        period.totalShares -= _amount;
        period.shares[msg.sender] = shares[msg.sender];

        if (!sharesContract.transfer(msg.sender, _amount)) {
            throw;
        }

        WithdrawShares(msg.sender, _amount);
        return true;
    }

    function withdrawRewardTotal(address _assetAddress) returns(bool) {
        return withdrawRewardFor(_assetAddress, msg.sender, rewardsFor(_assetAddress, msg.sender));
    }

    function withdrawRewardTotalFor(address _assetAddress, address _address) returns(bool) {
        return withdrawRewardFor(_assetAddress, _address, rewardsFor(_assetAddress, _address));
    }

    function withdrawReward(address _assetAddress, uint _amount) returns(bool) {
        return withdrawRewardFor(_assetAddress, msg.sender, _amount);
    }

    function withdrawRewardFor(address _assetAddress, address _address, uint _amount) returns(bool) {
        if (rewardsLeft[_assetAddress] == 0) {
            Error("No rewards left");
            return false;
        }

        Asset assetContract = Asset(_assetAddress);

        uint startBalance = assetContract.balanceOf(this);
        if (!assetContract.transfer(_address, _amount)) {
            Error("Asset transfer failed");
            return false;
        }

        uint endBalance = assetContract.balanceOf(this);
        uint diff = startBalance - endBalance;
        if (rewardsFor(_assetAddress, _address) < diff) {
            throw;
        }

        rewards[_assetAddress][_address] -= diff;
        rewardsLeft[_assetAddress] -= diff;

        WithdrawReward(_assetAddress, _address, _amount);
        return true;
    }

    // common
    function depositBalance(address _address) constant returns(uint) {
        return shares[_address];
    }

    function depositBalanceInPeriod(address _address, uint _period) constant returns(uint) {
        return periods[_period].shares[_address];
    }

    function totalDepositInPeriod(uint _period) constant returns(uint) {
        return periods[_period].totalShares;
    }

    function lastPeriod() constant returns(uint) {
        return periods.length - 1;
    }

    function lastClosedPeriod() constant returns(uint) {
        if (periods.length == 1) {
            throw;
        }
        return periods.length - 2;
    }

    function isClosed(uint _period) constant returns(bool) {
        return lastClosedPeriod() >= _period;
    }

    function assetBalanceInPeriod(address _assetAddress, uint _period) constant returns(uint) {
        return periods[_period].assetBalances[_assetAddress];
    }

    function isCalculatedFor(address _assetAddress, address _address, uint _period) constant returns(bool) {
        return periods[_period].calculated[_assetAddress][_address];
    }

    function rewardsFor(address _assetAddress, address _address) constant returns(uint) {
        return rewards[_assetAddress][_address];
    }
}