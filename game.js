var print = console.log.bind(console);

function Game() {
  var private;
  var public; // ar[9][9], ar[x][y] = {rank: , source: sourceObj}

  var init = function() {
    public = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        var unknown = {rank: 0, source: -1};
        rowL.push(unknown);
      }
      public.push(rowL);
    }

    private = [];
    for(var row = 0; row < 9; ++row) {
      var rowL = [];
      for(var col = 0; col < 9; ++col) {
        rowL.push(col + 1);
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
    init: function() { init(); return self; },
    guess: function(pid, guessObj) { return guess(pid, guessObj) },

    getPublic: function() { return public },
  }
  return self;
}

module.exports = Game;