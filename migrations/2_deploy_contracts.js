var Stub = artifacts.require("./helpers/Stub.sol");
var ChronoBankPlatform = artifacts.require("./ChronoBankPlatform.sol");
var ChronoBankPlatformTestable = artifacts.require("./ChronoBankPlatformTestable.sol");
var ChronoBankPlatformEmitter = artifacts.require("./ChronoBankPlatformEmitter.sol");
var EventsHistory = artifacts.require("./EventsHistory.sol");
var ChronoBankAssetProxy = artifacts.require("./ChronoBankAssetProxy.sol");
var ChronoBankAsset = artifacts.require("./ChronoBankAsset.sol");
var ChronoBankAssetWithFee = artifacts.require("./ChronoBankAssetWithFee.sol");
var Exchange = artifacts.require("./Exchange.sol");
var Rewards = artifacts.require("./Rewards.sol");
var FakeCoin = artifacts.require("./FakeCoin.sol");
var FakeCoin2 = artifacts.require("./FakeCoin2.sol");
var FakeCoin3 = artifacts.require("./FakeCoin3.sol");

module.exports = function(deployer) {
  deployer.deploy(Stub);
  deployer.deploy(ChronoBankPlatform);
  deployer.deploy(ChronoBankPlatformTestable);
  deployer.deploy(ChronoBankPlatformEmitter);
  deployer.deploy(EventsHistory);
  deployer.deploy(ChronoBankAssetProxy);
  deployer.deploy(ChronoBankAsset);
  deployer.deploy(ChronoBankAssetWithFee);
  deployer.deploy(Exchange);
  deployer.deploy(Rewards);
  deployer.deploy(FakeCoin);
  deployer.deploy(FakeCoin2);
  deployer.deploy(FakeCoin3);
};
