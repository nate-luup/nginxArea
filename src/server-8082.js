const http = require('http');

const server = http.createServer((req, res) => {
  res.end('server runing on 8082');
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8082);
