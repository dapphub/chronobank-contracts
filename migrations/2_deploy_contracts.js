module.exports = function(deployer) {
  deployer.deploy(Stub);
  deployer.deploy(ChronoBankPlatform);
  deployer.deploy(ChronoBankPlatformEmitter);
  deployer.deploy(EventsHistory);
  deployer.deploy(ChronoBankAsset);
};
