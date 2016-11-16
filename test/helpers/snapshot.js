var http = require('http');

function snapshot(done) {
  var options = {
    host: 'localhost',
    port: '8545',
    method: 'POST'
  };
  http.request(options).end('{"id":0,"jsonrpc":"2.0","params":[],"method":"evm_snapshot"}', done);
}

module.exports = snapshot;
