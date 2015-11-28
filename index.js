var express = require('express');
var io = require('socket.io');
var http = require('http');

var print = console.log.bind(console);

var app = express();

app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

var httpServer = http.createServer(app);

var server = require('./server')(); // server object
server.attach(httpServer);
httpServer.listen(app.get('port'));