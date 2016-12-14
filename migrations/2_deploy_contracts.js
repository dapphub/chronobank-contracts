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
