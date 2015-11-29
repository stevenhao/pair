var engine = require('./engine');
var print = console.log.bind(console);

function Game() {
  var private;
  var public; // ar[9][9], ar[x][y] = {rank: , source: sourceObj}

  var init = function(difficulty) {
    var gameObj = engine.makeGame(difficulty);
    // gameObj = {publicNums, privateNums}
    // publicNums[x][y] = 0 -> empty
    public = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        var p = {rank: gameObj.public[row][col], source: -1};
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
      } else {
        return 'ok';
      }
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
    init: function() { init('easy'); return self; },
    guess: function(pid, guessObj) { return guess(pid, guessObj) },

    getPublic: function() { return public },
  }
  return self;
}

module.exports = Game;