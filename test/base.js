var Reverter = require('./helpers/reverter');
contract('Stub', function(accounts) {
  var reverter = new Reverter(web3);
  before('snapshot', reverter.snapshot);
  afterEach('revert', reverter.revert);

  it('should have correct name', function() {
    var stub = Stub.deployed();
    return stub.name()
      .then(function (name) {
        assert.equal(name, 'Stub');
      });
  });
});
