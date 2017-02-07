var Exchange = artifacts.require("./Exchange.sol");
var FakeCoin = artifacts.require("./FakeCoin.sol");

var Reverter = require('./helpers/reverter');
var bytes32 = require('./helpers/bytes32');
var eventsHelper = require('./helpers/eventsHelper');
contract('Exchange', (accounts) => {
  let reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  let exchange;
  let coin;
  const BUY_PRICE = 1;
  const SELL_PRICE = 2;
  const BALANCE = 1000;
  const BALANCE_ETH = 100;

  let assertBalance = (address, expectedBalance) => {
    return coin.balanceOf(address)
      .then((balance) => assert.equal(balance, expectedBalance));
  };

  let assertEthBalance = (address, expectedBalance) => {
    return Promise.resolve()
      .then(() => web3.eth.getBalance(address))
      .then((balance) => assert.equal(balance.valueOf(), expectedBalance));
  };

  let getTransactionCost = (hash) => {
   return Promise.resolve().then(() =>
      hash.receipt.gasUsed);
  };

  before('Set Coin contract address', (done) => {
    Exchange.deployed().then(function(instance) {
    exchange = instance;
    FakeCoin.deployed().then(function(instance) {
    coin = instance;
    coin.mint(accounts[0], BALANCE)
      .then(() => coin.mint(accounts[1], BALANCE))
      .then(() => coin.mint(exchange.address, BALANCE))
      .then(() => web3.eth.sendTransaction({to: exchange.address, value: BALANCE_ETH, from: accounts[0]}))
      .then(() => reverter.snapshot(done))
      .catch(done);
    });
   });
  });

  it('should receive the right contract address after init() call', () => {
    return exchange.init(coin.address)
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, coin.address));
  });

  it('should not be possible to set another contract after first init() call', () => {
    return exchange.init(coin.address)
      .then(() => exchange.init('0x1'))
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, coin.address));
  });

  it('should not be possible to init by non-owner', () => {
    return exchange.init(coin.address, {from: accounts[1]})
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, '0x0000000000000000000000000000000000000000'));
  });

  it('should not be possible to set prices by non-owner', () => {
    return exchange.setPrices(10, 20, {from: accounts[1]})
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, BUY_PRICE))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, SELL_PRICE));
  });

  it('should be possible to set new prices', () => {
    let newBuyPrice = 10;
    let newSellPrice = 20;

    return exchange.setPrices(newBuyPrice, newSellPrice)
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, newBuyPrice))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, newSellPrice));
  });

  it('should not be possible to set prices sellPrice < buyPrice', () => {
    let newBuyPrice = 20;
    let newSellPrice = 10;

    return exchange.setPrices(newBuyPrice, newSellPrice)
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, BUY_PRICE))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, SELL_PRICE));
  });

  it('should not be possible to sell with price > buyPrice', () => {
    let balance;
    return exchange.init(coin.address)
      .then(() => web3.eth.getBalance(accounts[0]))
      .then((result) => balance = result)
      .then(() => exchange.sell(1, BUY_PRICE + 1))
      //.then(getTransactionCost)
     // .then((txCost) => assertEthBalance(accounts[0], balance.sub(txCost).valueOf()))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to sell more than you have', () => {
    return exchange.init(coin.address)
      .then(() => exchange.sell(BALANCE + 1, BUY_PRICE))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to sell tokens if exchange eth balance is less than needed', () => {
    return exchange.init(coin.address)
      .then(() => exchange.sell(BALANCE_ETH + 1, BUY_PRICE))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should be possible to sell tokens', () => {
    let sellAmount = 50;
    let balance;
    return exchange.init(coin.address)
      .then(() => web3.eth.getBalance(accounts[0]))
      .then((result) => balance = result)
      .then(() => exchange.sell(sellAmount, BUY_PRICE))
      //.then(getTransactionCost)
      //.then((txCost) => assertEthBalance(accounts[0], balance.sub(txCost).add(sellAmount).valueOf()))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH - sellAmount))
      .then(() => assertBalance(accounts[0], BALANCE - sellAmount))
      .then(() => assertBalance(exchange.address, BALANCE + sellAmount));
  });

  it('should not be possible to buy with price < sellPrice', () => {
    let balance;
    return exchange.init(coin.address)
      .then(() => exchange.buy(1, SELL_PRICE - 1, {value: SELL_PRICE})
        .then(assert.fail, () => {})
      );
  });

  it('should not be possible to buy if exchange token balance is less than needed', () => {
    return exchange.init(coin.address)
      .then(() => exchange.buy(BALANCE + 1, SELL_PRICE, {value: (BALANCE + 1) * SELL_PRICE})
        .then(assert.fail, () => {})
      );
  });

  it('should not be possible to buy if msg.value is less than _amount * _price', () => {
    return exchange.init(coin.address)
      .then(() => exchange.buy(1, SELL_PRICE, {value: SELL_PRICE - 1})
        .then(assert.fail, () => {})
      );
  });

  it('should not be possible to buy if msg.value is greater than _amount * _price', () => {
    return exchange.init(coin.address)
      .then(() => exchange.buy(1, SELL_PRICE, {value: SELL_PRICE + 1})
        .then(assert.fail, () => {})
      );
  });

  it('should not be possible to buy if _amount * _price overflows', () => {
    return exchange.init(coin.address)
      .then(() => exchange.buy(2, web3.toBigNumber(2).pow(255), {value: 0})
        .then(assert.fail, () => {})
      );
  });

  it('should buy tokens with msg.value == _amount * _price', () => {
    let buyAmount = 50;
    return exchange.init(coin.address)
      .then(() => exchange.buy(buyAmount, SELL_PRICE, {value: buyAmount * SELL_PRICE}))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH + (buyAmount * SELL_PRICE)))
      .then(() => assertBalance(accounts[0], BALANCE + buyAmount))
      .then(() => assertBalance(exchange.address, BALANCE - buyAmount));
  });

  it('should not be possible to withdraw tokens by non-owner', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawTokens(accounts[0], 10, {from: accounts[1]}))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });
  
  it('should not be possible to withdraw if exchange token balance is less than _amount', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawTokens(accounts[0], BALANCE + 1))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should withdraw tokens and fire WithdrawTokens event', () => {
    let withdrawValue = 10;
    let watcher;
    return exchange.init(coin.address)
      .then(() => {
        eventsHelper.setupEvents(exchange);
        watcher = exchange.WithdrawTokens();
        return exchange.withdrawTokens(accounts[1], withdrawValue);
      })
      .then((txHash) => eventsHelper.getEvents(txHash, watcher))
      .then((events) => {
        assert.equal(events.length, 1);
        assert.equal(events[0].args.recipient.valueOf(), accounts[1]);
        assert.equal(events[0].args.amount.valueOf(), withdrawValue);
      })
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE + withdrawValue))
      .then(() => assertBalance(exchange.address, BALANCE - withdrawValue));
  });

  it('should not be possible to withdraw all tokens by non-owner', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawAllTokens(accounts[0], {from: accounts[1]}))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to withdraw eth by non-owner', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawEth(accounts[0], 10, {from: accounts[1]}))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should not be possible to withdraw if exchange eth balance is less than _amount', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawEth(accounts[0], BALANCE_ETH + 1))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should withdraw eth and fire WithdrawEth event', () => {
    let withdrawValue = 10;
    let withdrawTo = '0x0000000000000000000000000000000000000005';
    let watcher;
    return exchange.init(coin.address)
      .then(() => {
        eventsHelper.setupEvents(exchange);
        watcher = exchange.WithdrawEth();
        return exchange.withdrawEth(withdrawTo, withdrawValue);
      })
      .then((txHash) => eventsHelper.getEvents(txHash, watcher))
      .then((events) => {
        assert.equal(events.length, 1);
        assert.equal(events[0].args.recipient.valueOf(), withdrawTo);
        assert.equal(events[0].args.amount.valueOf(), withdrawValue);
      })
      .then(() => assertEthBalance(withdrawTo, withdrawValue))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH - withdrawValue));
  });

  it('should not be possible to withdraw all eth by non-owner', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawAllEth(accounts[0], {from: accounts[1]}))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should not be possible to withdraw all by non-owner', () => {
    return exchange.init(coin.address)
      .then(() => exchange.withdrawAll(accounts[0], {from: accounts[1]}))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });
});
