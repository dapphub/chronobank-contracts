pragma solidity 0.4.4;

contract ChronoBankRewards {
    // uint constant DEPOSIT_INTERVAL = 10 days;
    // uint constant SNAPSHOT_INTERVAL = 3 hours;
    // uint constant CALCULATE_INTERVAL = 10 days;

    // enum State {
    //     DEPOSIT,
    //     SNAPSHOT,
    //     CALCULATE
    // }

    // modifier onlyState(State _state) {
    //     if (state == _state) {
    //         _;
    //     }
    // }

    // modifier assureInterval() {
    //     if (state == _state) {
    //         _;
    //     }
    // }

    // modifier onlyState(State _state) {
    //     if (state == _state) {
    //         _;
    //     }
    // }

    // function deposit(uint _value) onlyState(State.DEPOSIT) returns(bool) {
    //     if (!ChronoBankAsset(time).transferFrom(msg.sender, address(this), _value)) {
    //         return false;
    //     }
    //     balanceOf[msg.sender] += _value;
    //     snapshotBalance[time] += _value;
    //     return true;
    // }

    // function snapshotTime() onlyState(State.DEPOSIT) assureInterval() updateIntervalStart() returns(bool) {
    //     state = State.SNAPSHOT;
    //     return true;
    // }

    // function snapshot(address _asset) onlyState(State.SNAPSHOT) returns(bool) {
    //     snapshotBalance[_asset] = ChronoBankAsset(_asset).balanceOf(address(this)) - snapshotBalance[_asset];
    //     return true;
    // }
}
