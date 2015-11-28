var print = console.log.bind(console);
var socketio = require('socket.io');
var Game = require('./game');

function Server() {
  var io, game = Game().init(), playerInfo = [];

  function Client() {
    var socket, pid = -1;

    function attach(_socket) {
      socket = _socket;
      socket.on('refresh', refresh);
      socket.on('register', register);
      socket.on('rename', rename);
      socket.on('guess', guess);
      socket.on('logout', logout);
      socket.on('disconnect', disconnect);
    }

    function refresh() {
      print('refreshing', {playerInfo: playerInfo});

      socket.emit('updatePlayers', playerInfo);
      socket.emit('updateGame', game.getPublic());
    }

    function register(username) {
      if (pid == -1) {
        pid = 0;
        while (pid < playerInfo.length) {
          if (playerInfo[pid].username == username) {
            if (playerInfo[pid].online) {
              // TODO: handle teams??
              socket.emit('err', {action: 'register', reason: 'username taken'});
              return;
            }
            print('attached to', username);
            playerInfo[pid].online += 1;
            break;
          } else {
            ++pid;
          }
        }

        if (pid == playerInfo.length) {
          var userInfo = {username: username, score: 0, online: 1}
          playerInfo.push(userInfo);
          print('registered', username, 'to pid=', pid, userInfo);
        }
      } else {
        socket.emit('err', {action: 'register', reason: 'already registeerd'});
      }
      socket.emit('register', pid);
      updateAll();
    }

    function logout() {
      print('logout');
      if (pid != -1) {
        playerInfo[pid].online -= 1;
      }
      pid = -1;
      socket.emit('logout');
      updateAll();
    }

    function disconnect() {
      if (pid == -1) {
        // don't need to do anything
      } else {
        playerInfo[pid].online -= 1;
      }
      updateAll();
    }

    function rename(username) {
      if (pid == -1) {
        socket.emit('err', {action: 'rename', reason: 'not registered'});
        return;
      }
      playerInfo[pid].username = username;
      print('updated:', {pid: pid, username: username});
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

    var self = {
      attach: function(socket) { attach(socket) },
    }
    return self;
  }

  function attach(app) {
    io = socketio(app);
    io.on('connection', function(socket) {
      var client = Client();
      client.attach(socket);
    });
  }

  var updateAll = function() {
    print('updating all', {playerInfo: playerInfo});
    io.emit('updatePlayers', playerInfo);
    io.emit('updateGame', game.getPublic());
  }

  self = {
    attach: function(app) { attach(app) },
  }
  return self;
}

module.exports = Server;
