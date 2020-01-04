// file http-server.js
var https = require('https');
var fs = require('fs');
var path = require('path')

var options = {
  key: fs.readFileSync(path.resolve(__dirname, '../cert/server.key')),
  cert: fs.readFileSync(path.resolve(__dirname, '../cert/server.crt'))
};

https.createServer(options, function(req, res) {
  res.writeHead(200);
  res.end('hello world');
}).listen(8000);
