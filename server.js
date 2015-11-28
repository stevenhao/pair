var print = console.log.bind(console);
var socketio = require('socket.io');
var Game = require('./game');

module.exports = function() {

  function Server() {
    var io, game, playerInfo;

    function Player() {
      var socket, pid = -1;
      var init = function() {
      },

      attach = function(_socket) {
        socket = _socket;
        socket.on('refresh', refresh);
        socket.on('register', register);
      },

      refresh = function() {
        print('refreshing', {playerInfo: playerInfo});

        socket.emit('updatePlayers', playerInfo);
        socket.emit('updateGame', game.getPublic());
      },

      register = function(userInfo) {
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
      },

      self = {
        init: function() { init() },
        attach: function(socket) { attach(socket) },
      }
      return self;
    }

    var init = function() {
      game = Game();
      game.init();
      playerInfo = [];
    },
    
    attach = function(app) {
      io = socketio(app);
      io.on('connection', function(socket) {
        var player = Player();
        player.attach(socket);
      });
    },

    updateAll = function() {
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