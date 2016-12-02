module.exports = function(deployer) {
  deployer.deploy(Stub);
  deployer.deploy(ChronoBankPlatform);
  deployer.deploy(ChronoBankPlatformTestable);
  deployer.deploy(ChronoBankPlatformEmitter);
  deployer.deploy(EventsHistory);
  deployer.deploy(ChronoBankAssetProxy);
  deployer.deploy(ChronoBankAsset);
  deployer.deploy(ChronoBankAssetWithFee);
};
