var Reverter = require('./helpers/reverter');
var bytes32 = require('./helpers/bytes32');
var eventsHelper = require('./helpers/eventsHelper');
contract('Rewards', (accounts) => {
  let reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  let reward;
  let shares;
  let asset1;
  let asset2;

  const ZERO_INTERVAL = 0;
  const SHARES_BALANCE = 1000;

  let defaultInit = () => reward.init(shares.address, ZERO_INTERVAL);

  let assertSharesBalance = (address, expectedBalance) => {
    return shares.balanceOf(address)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertAsset1Balance = (address, expectedBalance) => {
    return asset1.balanceOf(address)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertDepositBalance = (address, expectedBalance) => {
    return reward.depositBalance(address)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertDepositBalanceInPeriod = (address, period, expectedBalance) => {
    return reward.depositBalanceInPeriod(address, period)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertTotalDepositInPeriod = (period, expectedBalance) => {
    return reward.totalDepositInPeriod(period)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertAssetBalanceInPeriod = (assetAddress, period, expectedBalance) => {
    return reward.assetBalanceInPeriod(assetAddress, period)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertRewardsLeft = (assetAddress, expectedBalance) => {
    return reward.rewardsLeft(assetAddress)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  let assertRewardsFor = (address, assetAddress, expectedBalance) => {
    return reward.rewardsFor(assetAddress, address)
      .then((balance) => assert.equal(balance.toString(), '' + expectedBalance));
  };

  before('Setup', (done) => {
    reward = Rewards.deployed();
    shares = FakeCoin.deployed();
    asset1 = FakeCoin2.deployed();
    asset2 = FakeCoin3.deployed();

    // init shares
    shares.mint(accounts[0], SHARES_BALANCE)
      .then(() => shares.mint(accounts[1], SHARES_BALANCE))
      .then(() => shares.mint(accounts[2], SHARES_BALANCE))
      // snapshot
      .then(() => reverter.snapshot(done))
      .catch(done);
  });

  // init(address _sharesContract, uint _closeIntervalDays) returns(bool)
  it('should receive the right shares contract address after init() call', () => {
    return defaultInit()
      .then(reward.sharesContract)
      .then((address) => assert.equal(address, shares.address))
  });

  it('should not be possible to call init twice', () => {
    return defaultInit()
      .then(() => reward.init('0x1', 30))
      .then(reward.sharesContract)
      .then((address) => assert.equal(address, shares.address))
      .then(reward.closeInterval)
      .then((interval) => assert.equal(interval, ZERO_INTERVAL))
  });

  // depositFor(address _address, uint _amount) returns(bool)
  it('should return true if was called with 0 shares (copy from prev period)', () => {
    return defaultInit()
      .then(() => reward.depositFor.call(accounts[0], 0))
      .then((res) => assert.isTrue(res))
  });

  it('should not deposit if sharesContract.transferFrom() failed', () => {
    return defaultInit()
      .then(() => reward.depositFor(accounts[0], SHARES_BALANCE + 1))
      .then(() => assertSharesBalance(accounts[0], 1000))
      .then(() => assertDepositBalance(accounts[0], 0))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 0))
      .then(() => assertTotalDepositInPeriod(0, 0))
  });

  it('should be possible to deposit shares', () => {
    return defaultInit()
      .then(() => reward.depositFor(accounts[0], 100))
      .then(() => assertDepositBalance(accounts[0], 100))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 100))
      .then(() => assertTotalDepositInPeriod(0, 100))
  });

  it('should be possible to make deposit several times in one period', () => {
    return defaultInit()
      // 1st deposit
      .then(() => reward.depositFor(accounts[0], 100))
      .then(() => assertDepositBalance(accounts[0], 100))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 100))
      .then(() => assertTotalDepositInPeriod(0, 100))
      // 2nd deposit
      .then(() => reward.depositFor(accounts[0], 100))
      .then(() => assertDepositBalance(accounts[0], 200))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 200))
      .then(() => assertTotalDepositInPeriod(0, 200))
      // 3rd deposit
      .then(() => reward.depositFor(accounts[1], 100))
      .then(() => assertDepositBalance(accounts[1], 100))
      .then(() => assertDepositBalanceInPeriod(accounts[1], 0, 100))

      .then(() => assertTotalDepositInPeriod(0, 300))
  });

  it('should be possible to call deposit(0) several times', () => {
    return defaultInit()
      // 1st period - deposit 50
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.depositFor(accounts[0], 50))
      .then(reward.closePeriod)
      .then(() => assertTotalDepositInPeriod(0, 50))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 0, 100))

      // 2nd period - deposit 0 several times
      .then(() => asset1.mint(reward.address, 200))
      .then(() => reward.depositFor(accounts[0], 0))
      .then(() => reward.depositFor(accounts[0], 0))
      .then(() => reward.depositFor(accounts[0], 0))
      .then(reward.closePeriod)
      .then(() => assertTotalDepositInPeriod(1, 50))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 1, 200))
  });

  // closePeriod() returns(bool)
  it('should not be possible to close period if period.startDate + closeInterval * 1 days > now', () => {
    return reward.init(shares.address, ZERO_INTERVAL + 1)
      .then(() => reward.closePeriod.call())
      .then((res) => assert.isFalse(res))
      .then(reward.closePeriod)
      // periods.length still 0
      .then(reward.lastPeriod)
      .then((period) => assert.equal(period, 0))
  });

  it('should be possible to close period', () => {
    return defaultInit()
      .then(reward.closePeriod)
      // periods.length become 1
      .then(reward.lastPeriod)
      .then((period) => assert.equal(period, 1))
  });

  // registerAsset(address _assetAddress) returns(bool)
  it('should not be possible to register asset for first period (periods.length == 1)', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.registerAsset(asset1.address)
        .then(assert.fail, () => {})
      );
  });

  it('should not be possible to register asset twice with non zero balance', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(reward.closePeriod)
      // 1st registration - true
      .then(() => reward.registerAsset.call(asset1.address))
      .then((res) => assert.isTrue(res))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 0, 100))
      .then(() => assertRewardsLeft(asset1.address, 100))

      .then(() => asset1.mint(reward.address, 200))
      // 2nd registration - false
      .then(() => reward.registerAsset.call(asset1.address))
      .then((res) => assert.isFalse(res))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 0, 100))
      .then(() => assertRewardsLeft(asset1.address, 100))
  });

  it('should count incoming rewards separately for each period', () => {
    return defaultInit()
      // 1st period
      .then(() => asset1.mint(reward.address, 100))
      .then(reward.closePeriod)
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 0, 100))

      .then(() => assertRewardsLeft(asset1.address, 100))

      // 2nd period
      .then(() => asset1.mint(reward.address, 200))
      .then(reward.closePeriod)
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 1, 200))

      .then(() => assertRewardsLeft(asset1.address, 300))
  });

  // calculateRewardForAddressAndPeriod(address _assetAddress, address _address, uint _period) returns(bool)
  it('should fail to calculate reward if there is only 1 period', () => {
    return defaultInit()
      .then(() => reward.calculateRewardForAddressAndPeriod.call('0x1', '0x1', 50)
        .then(assert.fail, () => {})
      );
  });

  it('should return false when calculating rewards for period that is not closed', () => {
    return defaultInit()
      .then(reward.closePeriod)
      .then(() => reward.deposit(50))
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.registerAsset(asset1.address))
      // call for unclosed period (last is always unclosed)
      .then(reward.lastPeriod)
      .then((lastPeriod) => reward.calculateRewardForAddressAndPeriod.call(asset1.address, accounts[0], lastPeriod))
      .then((res) => assert.isFalse(res))
  });

  it('should return false when calculating rewards if balance for assetAddress == 0', () => {
    return defaultInit()
      .then(() => reward.deposit(50))
      .then(reward.closePeriod)
      // call for closed period (last - 1 is always closed)
      .then(() => reward.calculateRewardForAddressAndPeriod.call('0x1', accounts[0], 0))
      .then((res) => assert.isFalse(res))
  });

  it('should calculate reward', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.deposit(75, { from: accounts[0] }))
      .then(() => reward.deposit(25, { from: accounts[1] }))
      .then(reward.closePeriod)
      .then(() => assertTotalDepositInPeriod(0, 100))

      .then(() => reward.registerAsset(asset1.address))

      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 0))
      .then(() => reward.isCalculatedFor(asset1.address, accounts[0], 0))
      .then((res) => assert.isTrue(res))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 75))

      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[1], 0))
      .then(() => reward.isCalculatedFor(asset1.address, accounts[1], 0))
      .then((res) => assert.isTrue(res))
      .then(() => assertRewardsFor(accounts[1], asset1.address, 25))
  });

  it('should calculate rewards for several periods', () => {
    return defaultInit()
      // 1st period - deposit 50
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.depositFor(accounts[0], 50))
      .then(() => reward.depositFor(accounts[1], 50))
      .then(reward.closePeriod)
      .then(() => assertTotalDepositInPeriod(0, 100))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 0, 100))

      // 2nd period - should accept all shares
      .then(() => asset1.mint(reward.address, 200))
      .then(() => reward.depositFor(accounts[0], 0))
      .then(() => reward.depositFor(accounts[1], 0))
      .then(reward.closePeriod)
      .then(() => assertTotalDepositInPeriod(1, 100))
      .then(() => reward.registerAsset(asset1.address))
      .then(() => assertAssetBalanceInPeriod(asset1.address, 1, 200))

      // calculate for 1st period
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 0))
      .then(() => reward.isCalculatedFor(asset1.address, accounts[0], 0))
      .then((res) => assert.isTrue(res))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 50))

      // calculate for 2nd period
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 1))
      .then(() => reward.isCalculatedFor(asset1.address, accounts[0], 1))
      .then((res) => assert.isTrue(res))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 150))
  });

  // withdrawShares(uint _amount) returns(bool)
  it('should not withdraw more shares than you have', () => {
    return defaultInit()
      .then(() => reward.deposit(100))
      .then(() => reward.withdrawShares.call(200))
      .then((res) => assert.isFalse(res))
      .then(() => reward.withdrawShares(200))
      .then(() => assertDepositBalance(accounts[0], 100))
      .then(() => assertTotalDepositInPeriod(0, 100))
      .then(() => assertSharesBalance(accounts[0], SHARES_BALANCE - 100))
      .then(() => assertSharesBalance(reward.address, 100))
  });

  it('should withdraw shares without deposit in new period', () => {
    return defaultInit()
      .then(() => reward.deposit(100))
      .then(() => assertDepositBalance(accounts[0], 100))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 100))
      .then(() => assertTotalDepositInPeriod(0, 100))
      .then(reward.closePeriod)

      .then(() => reward.withdrawShares(50))
      .then(() => assertDepositBalance(accounts[0], 50))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 1, 50))
      .then(() => assertTotalDepositInPeriod(1, 50))

      .then(() => reward.deposit(0))
      .then(() => assertDepositBalance(accounts[0], 50))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 1, 50))
      .then(() => assertTotalDepositInPeriod(1, 50))
  });

  it('should withdraw shares', () => {
    return defaultInit()
      .then(() => reward.deposit(100))
      .then(() => reward.withdrawShares(50))
      .then(() => assertDepositBalance(accounts[0], 50))
      .then(() => assertDepositBalanceInPeriod(accounts[0], 0, 50))
      .then(() => assertTotalDepositInPeriod(0, 50))
      .then(() => assertSharesBalance(accounts[0], SHARES_BALANCE - 50))
      .then(() => assertSharesBalance(reward.address, 50))
  });

  // withdrawRewardFor(address _address, uint _amount, address _assetAddress) returns(bool)
  it('should return false if rewardsLeft == 0', () => {
    return defaultInit()
      .then(() => reward.withdrawRewardFor.call(asset1.address, accounts[0], 100))
      .then((res) => assert.isFalse(res))
  });

  it('should withdraw reward', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.depositFor(accounts[0], 100))
      .then(reward.closePeriod)
      .then(() => reward.registerAsset(asset1.address))
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 0))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 100))

      .then(() => reward.withdrawRewardFor(asset1.address, accounts[0], 100))
      .then(() => assertAsset1Balance(accounts[0], 100))
      .then(() => assertRewardsLeft(asset1.address, 0))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 0))
  });

  it('should withdraw reward by different shareholders', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.depositFor(accounts[0], 100))
      .then(() => reward.depositFor(accounts[1], 200))
      .then(reward.closePeriod)
      .then(() => reward.registerAsset(asset1.address))
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 0))
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[1], 0))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 33))
      .then(() => assertRewardsFor(accounts[1], asset1.address, 66))

      .then(() => reward.withdrawRewardFor(asset1.address, accounts[0], 33))
      .then(() => reward.withdrawRewardFor(asset1.address, accounts[1], 66))
      .then(() => assertAsset1Balance(accounts[0], 33))
      .then(() => assertAsset1Balance(accounts[1], 66))
      .then(() => assertRewardsLeft(asset1.address, 1))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 0))
      .then(() => assertRewardsFor(accounts[1], asset1.address, 0))
  });

  it('should allow partial withdraw reward', () => {
    return defaultInit()
      .then(() => asset1.mint(reward.address, 100))
      .then(() => reward.depositFor(accounts[0], 100))
      .then(reward.closePeriod)
      .then(() => reward.registerAsset(asset1.address))
      .then(() => reward.calculateRewardForAddressAndPeriod(asset1.address, accounts[0], 0))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 100))

      .then(() => reward.withdrawRewardFor(asset1.address, accounts[0], 30))
      .then(() => assertAsset1Balance(accounts[0], 30))
      .then(() => assertRewardsLeft(asset1.address, 70))
      .then(() => assertRewardsFor(accounts[0], asset1.address, 70))
  });
});
