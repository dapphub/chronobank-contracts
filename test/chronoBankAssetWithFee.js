var Reverter = require('./helpers/reverter');
var bytes32 = require('./helpers/bytes32');
var eventsHelper = require('./helpers/eventsHelper');
contract('ChronoBankAssetWithFee', function(accounts) {
  var reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  var SYMBOL = bytes32(10);
  var SYMBOL2 = bytes32(1000);
  var NAME = 'Test Name';
  var DESCRIPTION = 'Test Description';
  var VALUE = 1001;
  var VALUE2 = 30000;
  var BASE_UNIT = 2;
  var IS_REISSUABLE = false;
  var chronoBankPlatform;
  var chronoBankAsset;

  before('setup others', function(done) {
    chronoBankPlatform = ChronoBankPlatformTestable.deployed();
    chronoBankAsset = ChronoBankAssetWithFee.deployed();
    var stub = Stub.deployed();
    chronoBankPlatform.setupEventsHistory(stub.address).then(function() {
      return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      return chronoBankPlatform.issueAsset(SYMBOL2, VALUE2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      return chronoBankAsset.init(chronoBankPlatform.address, SYMBOL, NAME);
    }).then(function() {
      reverter.snapshot(done);
    }).catch(done);
  });

  it('should be possible to get total supply', function() {
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.totalSupply.call();
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get balance for holder', function() {
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.balanceOf.call(accounts[0]);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get total supply if not allowed', function() {
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL2).then(function() {
      return chronoBankAsset.totalSupply.call();
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get balance if not allowed', function() {
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL2).then(function() {
      return chronoBankAsset.balanceOf.call(accounts[0]);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not emit transfer event from not base', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var watcher = chronoBankAsset.Transfer();
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL2).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL2);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankAsset);
      return chronoBankAsset.emitTransfer(owner, nonOwner, 100);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
    });
  });
  it('should not be possible to transfer if not allowed', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var watcher = chronoBankAsset.Transfer();
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL2).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL2);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankAsset);
      return chronoBankAsset.transfer(nonOwner, 100);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer amount 1 with balance 0', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 1;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.transfer(nonOwner, VALUE);
    }).then(function() {
      return chronoBankAsset.transfer(nonOwner, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to transfer amount 2 with balance 1', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var value = 1;
    var amount = 2;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.transfer(nonOwner, VALUE - value);
    }).then(function() {
      return chronoBankAsset.transfer(nonOwner, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - value);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount 0', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 0;
    var watcher = chronoBankAsset.Transfer();
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankAsset);
      return chronoBankAsset.transfer(nonOwner, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer to oneself', function() {
    var owner = accounts[0];
    var amount = 100;
    var watcher = chronoBankAsset.Transfer();
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankPlatform);
      return chronoBankAsset.transfer(owner, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to transfer amount 1 to existing holder with 0 balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 1;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.transfer(holder2, VALUE);
    }).then(function() {
      return chronoBankAsset.transfer(holder, amount, {from: holder2});
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to transfer amount 1 to missing holder', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 1;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to transfer amount 1 to holder with non-zero balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var balance2 = 100;
    var amount = 1;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankAsset.transfer(holder2, balance2);
    }).then(function() {
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), balance2 + amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - balance2 - amount);
    });
  });
  it('should keep transfers separated between chronoBankAssets', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 100;
    var watcher;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankAsset);
      watcher = chronoBankAsset.Transfer();
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.value.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL2);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE2);
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL2);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should emit transfer event from base', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 100;
    var watcher;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      eventsHelper.setupEvents(chronoBankAsset);
      watcher = chronoBankAsset.Transfer();
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.value.valueOf(), amount);
    });
  });

  it('should be possible to disable proxy', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var balance2 = 100;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setProxy(chronoBankAsset.address, false, SYMBOL);
    }).then(function() {
      return chronoBankAsset.transfer(holder2, balance2);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });

  it('should take min fee on transfer', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var feeAddress = accounts[2];
    var amount = 1;
    var feeMin = 1;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      return chronoBankAsset.setupFee(feeAddress);
    }).then(function() {
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function() {
      return chronoBankAsset.balanceOf(holder);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), VALUE - amount - feeMin);
      return chronoBankAsset.balanceOf(holder2);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), amount);
      return chronoBankAsset.balanceOf(feeAddress);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), feeMin);
    });
  });

  it('should take percent fee on transfer', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var feeAddress = accounts[2];
    var amount = 10000;
    var feePercent = 15; // 0.15 * 100; 
    return chronoBankAsset.init(chronoBankPlatform.address, SYMBOL2, NAME).then(function() {
      return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL2);
    }).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL2);
    }).then(function() {
      return chronoBankAsset.setupFee(feeAddress);
    }).then(function() {
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function() {
      return chronoBankAsset.balanceOf(holder);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), VALUE2 - amount - feePercent);
      return chronoBankAsset.balanceOf(holder2);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), amount);
      return chronoBankAsset.balanceOf(feeAddress);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), feePercent);
    });
  });

  it('should return fee on failed transfer', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var feeAddress = accounts[2];
    var amount = VALUE;
    return chronoBankPlatform.setProxy(chronoBankAsset.address, true, SYMBOL).then(function() {
      return chronoBankPlatform.setEventsProxy(chronoBankAsset.address, SYMBOL);
    }).then(function() {
      return chronoBankAsset.setupFee(feeAddress);
    }).then(function() {
      return chronoBankAsset.transfer(holder2, amount);
    }).then(function() {
      return chronoBankAsset.balanceOf(holder);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), VALUE);
      return chronoBankAsset.balanceOf(holder2);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 0);
      return chronoBankAsset.balanceOf(feeAddress);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 0);
    });
  });
});