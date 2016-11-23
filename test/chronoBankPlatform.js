var Reverter = require('./helpers/reverter');
var bytes32 = require('./helpers/bytes32');
var eventsHelper = require('./helpers/eventsHelper');
contract('ChronoBankPlatform', function(accounts) {
  var reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  var UINT_256_MINUS_3 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639933e+77';
  var UINT_256_MINUS_2 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639934e+77';
  var UINT_256_MINUS_1 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77';
  var UINT_256 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639936e+77';
  var UINT_255_MINUS_1 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819967e+76';
  var UINT_255 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819968e+76';

  var BYTES_32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  var BITS_257 = '0x10000000000000000000000000000000000000000000000000000000000000000';
  var ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

  var SYMBOL = bytes32(100);
  var NAME = 'Test Name';
  var DESCRIPTION = 'Test Description';
  var VALUE = 1001;
  var BASE_UNIT = 2;
  var IS_REISSUABLE = false;

  var chronoBankPlatform;
  var eventsHistory;

  before('setup', function(done) {
    chronoBankPlatform = ChronoBankPlatformTestable.deployed();
    eventsHistory = EventsHistory.deployed();
    var chronoBankPlatformEmitter = ChronoBankPlatformEmitter.deployed();
    var chronoBankPlatformEmitterAbi = web3.eth.contract(chronoBankPlatformEmitter.abi).at('0x0');
    var fakeArgs = [0,0,0,0,0,0,0,0];
    chronoBankPlatform.setupEventsHistory(eventsHistory.address).then(function() {
      return eventsHistory.addVersion(chronoBankPlatform.address, "Origin", "Initial version.");
    }).then(function() {
      return eventsHistory.addEmitter(chronoBankPlatformEmitterAbi.emitTransfer.getData.apply(this, fakeArgs).slice(0, 10), chronoBankPlatformEmitter.address);
    }).then(function() {
      return eventsHistory.addEmitter(chronoBankPlatformEmitterAbi.emitIssue.getData.apply(this, fakeArgs).slice(0, 10), chronoBankPlatformEmitter.address);
    }).then(function() {
      return eventsHistory.addEmitter(chronoBankPlatformEmitterAbi.emitRevoke.getData.apply(this, fakeArgs).slice(0, 10), chronoBankPlatformEmitter.address);
    }).then(function() {
      return eventsHistory.addEmitter(chronoBankPlatformEmitterAbi.emitOwnershipChange.getData.apply(this, fakeArgs).slice(0, 10), chronoBankPlatformEmitter.address);
    }).then(function() {
      return eventsHistory.addEmitter(chronoBankPlatformEmitterAbi.emitError.getData.apply(this, fakeArgs).slice(0, 10), chronoBankPlatformEmitter.address);
    }).then(function() {
      eventsHistory = ChronoBankPlatformEmitter.at(eventsHistory.address);
      reverter.snapshot(done);
    });
  });

  it('should not be possible to issue asset with existing symbol', function() {
    var symbol = SYMBOL;
    var value = 1001;
    var value2 = 3021;
    var name = 'Test Name';
    var name2 = '2Test Name2';
    var description = 'Test Description';
    var description2 = '2Test Description2';
    var baseUnit = 2;
    var baseUnit2 = 4;
    var isReissuable = false;
    var isReissuable2 = true;
    var watcher;
    return chronoBankPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Issue();
      return chronoBankPlatform.issueAsset(symbol, value2, name2, description2, baseUnit2, isReissuable2);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), name);
      return chronoBankPlatform.totalSupply.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.description.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), description);
      return chronoBankPlatform.baseUnit.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), baseUnit);
      return chronoBankPlatform.isReissuable.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should not be possible to issue asset by not platform owner', function() {
    var nonOwner = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE, {from: nonOwner}).then(function() {
      return chronoBankPlatform.isCreated.call(SYMBOL);
    }).then(function(result) {
      assert.isFalse(result);
    });
  });
  it('should be possible to issue asset with 1 bit 0 symbol', function() {
    var symbol = SYMBOL;
    return chronoBankPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue asset with 1 bit 1 symbol', function() {
    var symbol = bytes32(200);
    return chronoBankPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue asset with 32 bytes symbol', function() {
    var symbol = BYTES_32;
    return chronoBankPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should not be possible to issue fixed asset with 0 value', function() {
    var value = 0;
    var isReissuable = false;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.name.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should be possible to issue fixed asset with 1 value', function() {
    var value = 1;
    var isReissuable = false;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue fixed asset with (2**256 - 1) value', function() {
    var value = UINT_256_MINUS_1;
    var isReissuable = false;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue reissuable asset with 0 value', function() {
    var value = 0;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.name.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue reissuable asset with 1 value', function() {
    var value = 1;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue reissuable asset with (2**256 - 1) value', function() {
    var value = UINT_256_MINUS_1;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue asset with base unit 1', function() {
    var baseUnit = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.baseUnit.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 1);
    });
  });
  it('should be possible to issue asset with base unit 255', function() {
    var baseUnit = 255;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.baseUnit.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 255);
    });
  });
  it('should be possible to issue asset', function() {
    var symbol = SYMBOL;
    var value = 1001;
    var name = 'Test Name';
    var description = 'Test Description';
    var baseUnit = 2;
    var isReissuable = false;
    var watcher = eventsHistory.Issue();
    eventsHelper.setupEvents(eventsHistory);
    return chronoBankPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.symbol.valueOf(), symbol);
      assert.equal(events[0].args.value.valueOf(), value);
      assert.equal(events[0].args.by.valueOf(), accounts[0]);
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), name);
      return chronoBankPlatform.totalSupply.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.description.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), description);
      return chronoBankPlatform.baseUnit.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), baseUnit);
      return chronoBankPlatform.isReissuable.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should be possible to issue multiple assets', function() {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var owner = accounts[0];
    var value = 1001;
    var value2 = 3021;
    var name = 'Test Name';
    var name2 = '2Test Name2';
    var description = 'Test Description';
    var description2 = '2Test Description2';
    var baseUnit = 2;
    var baseUnit2 = 4;
    var isReissuable = false;
    var isReissuable2 = true;
    return chronoBankPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, value2, name2, description2, baseUnit2, isReissuable2);
    }).then(function() {
      return chronoBankPlatform.name.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), name);
      return chronoBankPlatform.name.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), name2);
      return chronoBankPlatform.totalSupply.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2);
      return chronoBankPlatform.description.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), description);
      return chronoBankPlatform.description.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), description2);
      return chronoBankPlatform.baseUnit.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), baseUnit);
      return chronoBankPlatform.baseUnit.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), baseUnit2);
      return chronoBankPlatform.isReissuable.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), isReissuable);
      return chronoBankPlatform.isReissuable.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), isReissuable2);
      return chronoBankPlatform.owner.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
      return chronoBankPlatform.owner.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should be possible to get asset name', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.name.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to get asset description', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.description.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), DESCRIPTION);
    });
  });
  it('should be possible to get asset base unit', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.baseUnit.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), BASE_UNIT);
    });
  });
  it('should be possible to get asset reissuability', function() {
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.isReissuable.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should be possible to get asset owner', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), accounts[0]);
    });
  });
  it('should be possible to check if address is asset owner', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.isOwner.call(accounts[0], SYMBOL);
    }).then(function(result) {
      assert.isTrue(result.valueOf());
    });
  });
  it('should be possible to check if address is owner of non-existing asset', function() {
    chronoBankPlatform.isOwner.call(accounts[0], SYMBOL).then(function(result) {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to check if asset is created', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.isCreated.call(SYMBOL);
    }).then(function(result) {
      assert.isTrue(result.valueOf());
    });
  });
  it('should be possible to check if asset is created for non-existing asset', function() {
    chronoBankPlatform.isCreated.call(SYMBOL).then(function(result) {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to get asset total supply with single holder', function() {
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get asset total supply with multiple holders', function() {
    var amount = 1001;
    var amount2 = 999;
    var holder2 = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, amount + amount2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, amount2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount + amount2);
    });
  });
  it('should be possible to get asset total supply with multiple holders holding 0 amount', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, VALUE, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder, VALUE, SYMBOL, {from: holder2});
    }).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, VALUE);
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get asset total supply with multiple holders holding (2**256 - 1) amount', function() {
    var value = UINT_256_MINUS_1;
    var holder = accounts[0];
    var holder2 = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, 10, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to get asset balance for holder', function() {
    var owner = accounts[0];
    var symbol2 = bytes32(10);
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, VALUE-10, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get asset balance for non owner', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 100;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to get asset balance for missing holder', function() {
    var nonOwner = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get missing asset balance for holder', function() {
    var nonAsset = 'LHNONEXIST';
    var owner = accounts[0];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get missing asset balance for missing holder', function() {
    var nonAsset = 'LHNONEXIST';
    var nonOwner = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to get name of missing asset', function() {
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.name.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should not be possible to get description of missing asset', function() {
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.description.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should not be possible to get base unit of missing asset', function() {
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.baseUnit.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to get reissuability of missing asset', function() {
    var nonAsset = 'LHNONEXIST';
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.isReissuable.call(nonAsset);
    }).then(function(result) {
      assert.isFalse(result);
    });
  });
  it('should not be possible to get owner of missing asset', function() {
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.owner.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), ADDRESS_ZERO);
    });
  });
  it('should not be possible to get total supply of missing asset', function() {
    chronoBankPlatform.totalSupply.call(SYMBOL).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to change ownership by non-owner', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.changeOwnership(SYMBOL, nonOwner, {from: nonOwner});
    }).then(function() {
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to change ownership to the same owner', function() {
    var owner = accounts[0];
    var watcher = eventsHistory.OwnershipChange();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.changeOwnership(SYMBOL, owner);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher)
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to change ownership of missing asset', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.changeOwnership(nonAsset, nonOwner);
    }).then(function() {
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
      return chronoBankPlatform.owner.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), ADDRESS_ZERO);
    });
  });
  it('should be possible to change ownership of asset', function() {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var watcher = eventsHistory.OwnershipChange();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.changeOwnership(SYMBOL, newOwner);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), owner);
      assert.equal(events[0].args.to.valueOf(), newOwner);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), newOwner);
    });
  });
  it('should be possible to reissue after ownership change', function() {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var isReissuable = true;
    var amount = 100;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.changeOwnership(SYMBOL, newOwner);
    }).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount, {from: newOwner});
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE + amount);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(newOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to revoke after ownership change to missing account', function() {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var amount = 100;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.changeOwnership(SYMBOL, newOwner);
    }).then(function() {
      return chronoBankPlatform.transfer(newOwner, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount, {from: newOwner});
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(newOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke after ownership change to existing account', function() {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var amount = 100;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(newOwner, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.changeOwnership(SYMBOL, newOwner);
    }).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount, {from: newOwner});
    }).then(function() {
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - amount);
      return chronoBankPlatform.balanceOf.call(newOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should keep ownership change separated between assets', function() {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var symbol2 = bytes32(10);
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      return chronoBankPlatform.changeOwnership(SYMBOL, newOwner);
    }).then(function() {
      return chronoBankPlatform.owner.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), newOwner);
      return chronoBankPlatform.owner.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to transfer missing asset', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 100;
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, amount, nonAsset);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(nonOwner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(owner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to transfer amount 1 with balance 0', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, VALUE, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(nonOwner, amount, SYMBOL);
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
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount (2**256 - 1) with balance (2**256 - 2)', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var value = UINT_256_MINUS_2;
    var amount = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount 0', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 0;
    var watcher = eventsHistory.Transfer();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.transfer(nonOwner, amount, SYMBOL);
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
    var watcher = eventsHistory.Transfer();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.transfer(owner, amount, SYMBOL);
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
  it('should not be possible to transfer amount (2**256 - 1) to holder with 1 balance', function() {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should not be possible to transfer amount 1 to holder with (2**256 - 1) balance', function() {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should not be possible to transfer amount 2**255 to holder with 2**255 balance', function() {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should be possible to transfer amount 2**255 to holder with (2**255 - 1) balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_255;
    var balance2 = UINT_255_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, balance2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount (2**255 - 1) to holder with 2**255 balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_255_MINUS_1;
    var balance2 = UINT_255;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, balance2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount (2**256 - 2) to holder with 1 balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_256_MINUS_2;
    var balance2 = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, balance2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount 1 to holder with (2**256 - 2) balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = 1;
    var balance2 = UINT_256_MINUS_2;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, balance2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount 1 to existing holder with 0 balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, VALUE, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder, amount, SYMBOL, {from: holder2});
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
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
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
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, balance2, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), balance2 + amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - balance2 - amount);
    });
  });
  it('should be possible to transfer amount (2**256 - 1) to existing holder with 0 balance', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.transfer(holder, amount, SYMBOL, {from: holder2});
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to transfer amount (2**256 - 1) to missing holder', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(holder2, amount, SYMBOL);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should keep transfers separated between assets', function() {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 100;
    var amount2 = 33;
    var watcher;
    return chronoBankPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Transfer();
      return chronoBankPlatform.transfer(holder2, amount, symbol);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), symbol);
      assert.equal(events[0].args.value.valueOf(), amount);
      assert.equal(events[0].args.reference.valueOf(), "");
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Transfer();
      return chronoBankPlatform.transfer(holder2, amount2, symbol2);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), symbol2);
      assert.equal(events[0].args.value.valueOf(), amount2);
      assert.equal(events[0].args.reference.valueOf(), "");
      return chronoBankPlatform.balanceOf.call(holder, symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value - amount);
      return chronoBankPlatform.balanceOf.call(holder2, symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(holder, symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2 - amount2);
      return chronoBankPlatform.balanceOf.call(holder2, symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount2);
    });
  });
  it('should be possible to do transfer with reference', function() {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var reference = "Invoice#AS001";
    var watcher;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Transfer();
      return chronoBankPlatform.transferWithReference(holder2, VALUE, SYMBOL, reference);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), VALUE);
      assert.equal(events[0].args.reference.valueOf(), reference);
      return chronoBankPlatform.balanceOf.call(holder2, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(holder, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to reissue asset by non-owner', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, 100, {from: nonOwner});
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue fixed asset', function() {
    var owner = accounts[0];
    var isReissuable = false;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, 100);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue 0 of reissuable asset', function() {
    var owner = accounts[0];
    var isReissuable = true;
    var amount = 0;
    var watcher;
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Issue();
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue missing asset', function() {
    var owner = accounts[0];
    var isReissuable = true;
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(nonAsset, 100);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(owner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to reissue 1 with total supply (2**256 - 1)', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var isReissuable = true;
    var amount = 1;
    var watcher;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Issue();
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to reissue (2**256 - 1) with total supply 1', function() {
    var owner = accounts[0];
    var value = 1;
    var isReissuable = true;
    var amount = UINT_256_MINUS_1;
    var watcher;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      watcher = eventsHistory.Issue();
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to reissue 1 with total supply (2**256 - 2)', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_2;
    var isReissuable = true;
    var amount = 1;
    var resultValue = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue 1 with total supply 0', function() {
    var owner = accounts[0];
    var value = 0;
    var isReissuable = true;
    var amount = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value + amount);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value + amount);
    });
  });
  it('should be possible to reissue (2**256 - 1) with total supply 0', function() {
    var owner = accounts[0];
    var value = 0;
    var isReissuable = true;
    var amount = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to reissue (2**256 - 2) with total supply 1', function() {
    var owner = accounts[0];
    var value = 1;
    var isReissuable = true;
    var amount = UINT_256_MINUS_2;
    var resultValue = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue (2**255 - 1) with total supply 2**255', function() {
    var owner = accounts[0];
    var value = UINT_255;
    var isReissuable = true;
    var amount = UINT_255_MINUS_1;
    var resultValue = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue 2**255 with total supply (2**255 - 1)', function() {
    var owner = accounts[0];
    var value = UINT_255_MINUS_1;
    var isReissuable = true;
    var amount = UINT_255;
    var resultValue = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should keep reissuance separated between assets', function() {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var amount = 100;
    var amount2 = 33;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, isReissuable);
    }).then(function() {
      return chronoBankPlatform.reissueAsset(symbol, amount);
    }).then(function() {
      return chronoBankPlatform.reissueAsset(symbol2, amount2);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder, symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value + amount);
      return chronoBankPlatform.totalSupply.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value + amount);
      return chronoBankPlatform.balanceOf.call(holder, symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2 + amount2);
      return chronoBankPlatform.totalSupply.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2 + amount2);
    });
  });
  it('should not be possible to revoke 1 from missing asset', function() {
    var owner = accounts[0];
    var amount = 1;
    var nonAsset = 'LHNONEXIST';
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.revokeAsset(nonAsset, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.balanceOf.call(owner, nonAsset);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to revoke 0 from fixed asset', function() {
    var owner = accounts[0];
    var amount = 0;
    var isReissuable = false;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to revoke 0 from reissuable asset', function() {
    var owner = accounts[0];
    var amount = 0;
    var isReissuable = true;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to revoke 1 with balance 0', function() {
    var owner = accounts[0];
    var value = 0;
    var amount = 1;
    var isReissuable = true;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke 2 with balance 1', function() {
    var owner = accounts[0];
    var value = 1;
    var amount = 2;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke (2**256 - 1) with balance (2**256 - 2)', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_2;
    var amount = UINT_256_MINUS_1;
    var isReissuable = true;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke 2**255 with balance (2**255 - 1)', function() {
    var owner = accounts[0];
    var value = UINT_255_MINUS_1;
    var amount = UINT_255;
    var isReissuable = true;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to revoke by non-owner', function() {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var balance = 100;
    var revokeAmount = 10;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.transfer(nonOwner, balance, SYMBOL);
    }).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, revokeAmount, {from: nonOwner});
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - balance);
      return chronoBankPlatform.balanceOf.call(nonOwner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), balance - revokeAmount);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), VALUE - revokeAmount);
    });
  });
  it('should be possible to revoke 1 from fixed asset with 1 balance', function() {
    var owner = accounts[0];
    var value = 1;
    var amount = 1;
    var isReissuable = false;
    var watcher = eventsHistory.Revoke();
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      eventsHelper.setupEvents(eventsHistory);
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), amount);
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 1 from reissuable asset with 1 balance', function() {
    var owner = accounts[0];
    var value = 1;
    var amount = 1;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 2**255 with 2**255 balance', function() {
    var owner = accounts[0];
    var value = UINT_255;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, value);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke (2**256 - 1) with (2**256 - 1) balance', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, value);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 1 with 2 balance', function() {
    var owner = accounts[0];
    var value = 2;
    var amount = 1;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value - amount);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value - amount);
    });
  });
  it('should be possible to revoke 2 with (2**256 - 1) balance', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var amount = 2;
    var resultValue = UINT_256_MINUS_3;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should keep revokes separated between assets', function() {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var amount = 100;
    var amount2 = 33;
    return chronoBankPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
      return chronoBankPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(function() {
      return chronoBankPlatform.revokeAsset(symbol, amount);
    }).then(function() {
      return chronoBankPlatform.revokeAsset(symbol2, amount2);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(holder, symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value - amount);
      return chronoBankPlatform.totalSupply.call(symbol);
    }).then(function(result) {
      assert.equal(result.valueOf(), value - amount);
      return chronoBankPlatform.balanceOf.call(holder, symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2 - amount2);
      return chronoBankPlatform.totalSupply.call(symbol2);
    }).then(function(result) {
      assert.equal(result.valueOf(), value2 - amount2);
    });
  });
  it('should be possible to reissue 1 after revoke 1 with total supply (2**256 - 1)', function() {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var amount = 1;
    var isReissuable = true;
    return chronoBankPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
      return chronoBankPlatform.revokeAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.reissueAsset(SYMBOL, amount);
    }).then(function() {
      return chronoBankPlatform.balanceOf.call(owner, SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
      return chronoBankPlatform.totalSupply.call(SYMBOL);
    }).then(function(result) {
      assert.equal(result.valueOf(), value);
    });
  });
});