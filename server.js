var print = console.log.bind(console);

module.exports = function() {
  var io = require('socket.io');
  var Game = require('./game');

  function Server() {
    var game;
    var init = function() {
      game = Game();
    },
    
    attach = function(app) {
      io(app).on('connection', function(socket) {
        print('connected!');
      });
    },

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