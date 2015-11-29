var print = console.log.bind(console);
var socketio = require('socket.io');
var Game = require('./game');

function randomGid() {
  return '' + Math.floor(Math.random() * 10000);
}

function GameServer() {
  var game = Game(), playerInfo = [], clients = [];

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
      function validate() {
        if (pid != -1) {
          return 'already registered';
        }
        if (username.length == 0) {
          return 'username is empty';
        }
        for(var userInfo of playerInfo) {
          if (userInfo.username == username && userInfo.online > 0) {
            return 'username taken and logged in';
          }
        }
        return 'ok';
      }
      var valid = validate();
      if (valid != 'ok') {
        socket.emit('err', {action: 'register', reason: valid});
        return;
      }

      pid = 0;
      while (pid < playerInfo.length) {
        if (playerInfo[pid].username == username) {
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
      function validate() {
        if (pid == -1) {
          return 'not registered';
        }
        if (username.length == 0) {
          return 'username is empty';
        }
        for(var userInfo of playerInfo) {
          if (userInfo.username == username) {
            return 'username taken';
          }
        }
        return 'ok';
      }
      var valid = validate();
      if (valid != 'ok') {
        socket.emit('err', {action: 'rename', reason: valid});
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
        socket.emit('err', {action: 'guess', reason: result.error});
      } else {
        if (result.result == 'correct') {
          playerInfo[pid].score += 1;
        } else {
          playerInfo[pid].score -= 3;
        }
      }
      updateAll();
    }

    function update() {
      socket.emit('updatePlayers', playerInfo);
      socket.emit('updateGame', game.getPublic());
    }

    var self = {
      attach: function(socket) { attach(socket) },
      update: function() { update() },
    }
    return self;
  }

  function updateAll() {
    print('updating all', {playerInfo: playerInfo});
    for(var client of clients) {
      client.update();
    }
  }

  function add(socket) {
    print('adding socket');
    var client = Client();
    client.attach(socket);
    clients.push(client);
  }

  self = {
    add: function(socket) { add(socket); },
    init: function(gameObj) { game.init(gameObj); return self; },
  }
  return self;
}

function Server() {
  var gameServers = {};
  var lastGid = null; // most recent game created

  function attach(app) {
    io = socketio(app);
    io.on('connection', function(socket) {
      socket.on('conn', function(gid) {
        if (gid == null || !(gid in gameServers)) {
          gid = lastGid;
        }

        if (gid != null) {
          gameServers[gid].add(socket);
          socket.emit('conn');
        } else {
          socket.emit('err', {action: 'conn', reason: 'gid does not exist'});
        }
      });
    });
  }

  function createGame(gameObj) {
    var gid = randomGid();
    while (gid in gameServers) {
      gid = randomGid();
    }
    var gameServer = GameServer().init(gameObj);
    gameServers[gid] = gameServer;
    lastGid = gid;
    return gid;
  }

  var self = {
    attach: function(app) { attach(app) },
    createGame: function(gameObj) { return createGame(gameObj) },
  }
  return self;
}

module.exports = Server;
