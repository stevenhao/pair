var express = require('express');
var io = require('socket.io');
var http = require('http');

var print = console.log.bind(console);

var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/generate', function(req, res) {
  res.sendFile(__dirname + '/views/generate.html');
});

app.get('/sudoku', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

var httpServer = http.createServer(app);
var server = require('./server')(); // server object
server.attach(httpServer);

app.post('/sudoku', function(req, res) {
  print('got post', req.body);
  var gid = server.createGame(req.body);
  res.send({gid: gid});
});

httpServer.listen(app.get('port'));
print('http server listening on port '+ app.get('port'));