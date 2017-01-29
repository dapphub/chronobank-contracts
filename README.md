# SmartContracts [![Build Status](https://travis-ci.org/ChronoBank/SmartContracts.svg?branch=master)](https://travis-ci.org/ChronoBank/SmartContracts)
ChronoMint, Labour Hours and Time contracts.

- ChronoBankPlatform.sol acts as a base for all tokens operation (like issuing, balance storage, transfer).
- ChronoBankAsset.sol adds interface layout (described in ChronoBankAssetInterface.sol) 
- ChronoBankAssetWithFee.sol extends ChronoBankAsset.sol with operations fees logic.
- ChronoBankAssetProxy.sol acts as a transaction proxy, provide an ERC20 interface (described in ERC20Interface.sol) and allows additional logic insertions and wallet access recovery in case of key loss.
- EventsHistory.sol holds all operations events to avoid events lost in case of contract replacement during upgrade or extension.
- ChronoBankPlatformEmitter.sol provides platform events definition.

To understand contract logic better you can take a look at the comments also as at unit tests

![Alt tag](https://s30.postimg.org/lygb4kdk1/chronobankcontractsdiagram_1024.png "Smart Contracts Diagram")

## Testing
NodeJS 6+ required.
```bash
npm install -g ethereumjs-testrpc
npm install -g truffle
```

Then start TestRPC in a separate terminal by doing
```bash
testrpc
```

Then run tests in a project dir by doing
```bash
truffle test
```
