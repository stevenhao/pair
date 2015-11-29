var engine = require('./engine');
var print = console.log.bind(console);

function Game() {
  var private;
  var public; // ar[9][9], ar[x][y] = {rank: , source: sourceObj}

  var init = function(gameObj) {
    if (gameObj == null) {
      gameObj = engine.makeGame();
    } else {
      for (var x = 0; x < 9; ++x) {
        for (var y = 0; y < 9; ++y) {
          gameObj.public[x][y] = parseInt(gameObj.public[x][y]);
          gameObj.private[x][y] = parseInt(gameObj.private[x][y]);
        }
      }
    }
    print('init game, gameObj=', gameObj);
    // gameObj = {public: public, private: private}
    // public[x][y] = 0 -> empty
    public = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        var p;
        var pub = gameObj.public[row][col];
        if (pub == 1) {
          p = {rank: gameObj.private[row][col], source: -1};
        } else {
          p = {rank: 0, source: -1};
        }
        rowL.push(p);
      }
      public.push(rowL);
    }

    private = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        rowL.push(gameObj.private[row][col]);
      }
      private.push(rowL);
    }
  },

  guess = function(pid, guessObj) {
    var sq = guessObj.square, guess = guessObj.guess;
    var r = sq.row, c = sq.col;
    validate = function() {
      if (public[r][c].rank != 0) {
        return 'already showing';
      }
      var g = parseInt(guess);
      if (isNaN(g) || guess.length != 1 || g < 1 || g > 9) {
        return 'invalid guess ' + guess;
      }
      return 'ok';
    }
    action = function() {
      if (private[r][c] != guess) {
        return 'incorrect';
      } else {
        public[r][c].rank = private[r][c];
        public[r][c].source = pid;
        return 'correct';
      }
    }

    var errors = validate();
    if (errors != 'ok') {
      return {error: errors};
    } else {
      var result = action();
      return {result: result};
    }
  }

  var self = {
    init: function(gameObj) { init(gameObj); return self; },
    guess: function(pid, guessObj) { return guess(pid, guessObj) },

    getPublic: function() { return public },
  }
  return self;
}

module.exports = Game;