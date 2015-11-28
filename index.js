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

var server = http.createServer(app);
io(server).on('connection', function(socket) {
  print('connected!');
});

server.listen(app.get('port'));