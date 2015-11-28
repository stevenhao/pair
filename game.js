var print = console.log.bind(console);

function Game() {
  var private;
  var public; // ar[9][9], ar[x][y] = {rank: , source: sourceObj}

  var init = function() {
    private = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        rowL.push(0);
      }
      private.push(rowL);
    }
  },

  guess = function(guessObj) {
    var sq = guessObj.square, guess = guessObj.guess;
    var r = sq.row, c = sq.col;
    validate = function() {
      if (public[r][c] != 0) {
        return 'already showing';
      } else {
        return 'ok';
      }
    }
    action = function() {
      if (private[r][c] != guess) {
        return 'incorrect';
      } else {
        public[r][c] = private[r][c];
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
    init: function() { init(); return self; },
    guess: function(guessObj) { return guess(guessObj) },

    getPublic: function() { return public },
  }
  return self;
}

module.exports = Game;