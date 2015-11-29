function engine() {
  function makeGameDefault() {
    var private = [[4, 3, 5, 7, 6, 8, 9, 1, 2],
                   [2, 7, 6, 9, 1, 5, 3, 4, 8],
                   [8, 9, 1, 4, 3, 2, 5, 6, 7],
                   [6, 2, 4, 5, 8, 3, 7, 9, 1],
                   [9, 5, 8, 6, 7, 1, 4, 2, 3],
                   [3, 1, 7, 2, 9, 4, 8, 5, 6],
                   [5, 4, 3, 8, 2, 6, 1, 7, 9],
                   [1, 6, 9, 3, 5, 7, 2, 8, 4],
                   [7, 8, 2, 1, 4, 9, 6, 3, 5]];
    var public = [[0, 3, 0, 0, 6, 8, 0, 0, 0],
                 [2, 7, 0, 0, 1, 5, 3, 0, 0],
                 [0, 0, 0, 4, 0, 2, 5, 0, 0],
                 [0, 0, 0, 5, 8, 0, 0, 9, 0],
                 [0, 0, 0, 6, 0, 1, 0, 2, 0],
                 [0, 0, 7, 0, 0, 0, 8, 5, 0],
                 [0, 0, 3, 8, 0, 0, 1, 0, 0],
                 [1, 0, 0, 0, 5, 7, 2, 0, 0],
                 [7, 0, 0, 1, 0, 0, 6, 0, 0]];
    return {private: private, public: public};
  }

  var self = {
    makeGame: function(difficulty) { return makeGameDefault(difficulty); }
  }
  return self;
}

module.exports = engine();