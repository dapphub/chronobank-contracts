var restore = require('./helpers/restore');
contract('Stub', function(accounts) {
  afterEach('Restore', restore);

  it('should have correct name', function() {
    var stub = Stub.deployed();
    return stub.name()
      .then(function (name) {
        assert.equal(name, 'Stub');
      });
  });
});
