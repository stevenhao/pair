var print = console.log.bind(console);
var socketio = require('socket.io');
var Game = require('./game');

module.exports = function() {
  function Server() {
    var io, game, playerInfo;

    function Player() {
      var socket, pid = -1;

      function attach(_socket) {
        socket = _socket;
        socket.on('refresh', refresh);
        socket.on('register', register);
        socket.on('guess', guess);
      }

      function refresh() {
        print('refreshing', {playerInfo: playerInfo});

        socket.emit('updatePlayers', playerInfo);
        socket.emit('updateGame', game.getPublic());
      }

      function register(userInfo) {
        var username = userInfo.username;
        if (pid == -1) {
          pid = playerInfo.length;
          userInfo.score = 0;
          playerInfo.push(userInfo);
          print('registered', username, 'to pid=', pid, userInfo);
        } else {
          playerInfo[pid].username = userInfo.username;
          print('updated name:', username, userInfo);
        }
        socket.emit('register', pid);
        updateAll();
      }

      function guess(guessObj) {
        if (pid == -1) {
          // probably shouldn't be guessing?
          socket.emit('err', {
            action: 'guess',
            reason: 'not registered',
          });
          return;
        }

        var result = game.guess(pid, guessObj);
        print('guessed', guessObj, 'result=',result);
        if ('error' in result) {
        } else {
          if (result.result == 'correct') {
            playerInfo[pid].score += 1;
          } else {
            playerInfo[pid].score -= 10;
          }
        }
        updateAll();
      }

      self = {
        attach: function(socket) { attach(socket) },
      }
      return self;
    }

    function init() {
      game = Game();
      game.init();
      playerInfo = [];
    }
    
    function attach(app) {
      io = socketio(app);
      io.on('connection', function(socket) {
        var player = Player();
        player.attach(socket);
      });
    }

    var updateAll = function() {
      print('updating all', {playerInfo: playerInfo});
      io.emit('updatePlayers', playerInfo);
      io.emit('updateGame', game.getPublic());
    }

    self = {
      init: function() { init() },
      attach: function(app) { attach(app) },
    }
    return self;
  }

  var server = Server();
  server.init();
  return server;
}