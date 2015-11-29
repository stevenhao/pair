print = console.log.bind(console);

hide = function(el) { el.css('display', 'none') }
unhide = function(el) { el.css('display', 'inline-block') }

var private;
var public;

function fillGrid(rows, cols, val) {
  var ret = [];
  for(var r = 0; r < rows; ++r) {
    var row = [];
    for(var c = 0; c < cols; ++c) {
      row.push(val);
    }
    ret.push(row);
  }
  return ret;
}

function rnd(n) {
  return Math.floor(n * Math.random());
}

var sqs = fillGrid(9, 9, 0);
var sq = 0;
for(var x = 0; x < 9; ++x) {
  for(var y = 0; y < 9; ++y) {
    sqs[x][y] = Math.floor(x / 3) * 3 + Math.floor(y / 3);
  }
}

function makeToTry() {
  to_try = [];
  for (var x = 0; x < 9; ++x) {
    for(var y = 0; y < 9; ++y) {
      to_try.push({});
      var k = rnd(to_try.length);
      to_try[to_try.length - 1] = to_try[k];
      to_try[k] = {x:x, y:y};
    }
  }
}

function generateSolvedGame() {
  var rows = fillGrid(9, 10, 0), cols = fillGrid(9, 10, 0), squares = fillGrid(9, 10, 0);
  function put(x, y, val) {
    if (rows[x][val] || cols[y][val] || squares[sqs[x][y]][val]) {
      return false;
    }
    rows[x][val] = cols[y][val] = squares[sqs[x][y]][val] = 1;
    return true;
  }

  function unput(x, y, val) {
    var sq = Math.floor(x / 3) * 3 + Math.floor(y / 3);
    rows[x][val] = cols[y][val] = squares[sqs[x][y]][val] = 0;
  }

  function dfs(x, y) { // returns # sols
    if (x == 9) return 1;
    var nx = x, ny = y + 1;
    if (ny == 9) {
      ny = 0;
      ++nx;
    }

    for(var tries = 0; tries < 10; ++tries) {
      var val = rnd(9) + 1;
      if (put(x, y, val)) {
        private[x][y] = val;
        if (dfs(nx, ny)) {
          return 1;
        }
        unput(x, y, val);
      }
    }
    return 0;
  }

  private = fillGrid(9, 9, 0);
  for(var i = 0; i < 10; ++i) {
    if (dfs(0, 0)) {
      print('successfully generated grid:', private);
      break;
    }
  }

  public = fillGrid(9, 9, 1);
  makeToTry();
}

function hideOne() {
  function countSolutions(public, x, y) {
    if (x == null) x = 0;
    if (y == null) y = 0;
  }

  function uniqueSolution() {
    var rows = fillGrid(9, 10, 0), cols = fillGrid(9, 10, 0), squares = fillGrid(9, 10, 0);
    function put(x, y, val) {
      if (rows[x][val] || cols[y][val] || squares[sqs[x][y]][val]) {
        return false;
      }
      rows[x][val] = cols[y][val] = squares[sqs[x][y]][val] = 1;
      return true;
    }

    function unput(x, y, val) {
      rows[x][val] = cols[y][val] = squares[sqs[x][y]][val] = 0;
    }

    var cnt = 0;
    function dfs(x, y) { // returns # sols
      var nx = x, ny = y + 1;
      if (ny == 9) {
        ny = 0;
        ++nx;
      }
      if (nx == 9) {
        ++cnt;
        return;
      }
      if (public[x][y]) {
        return dfs(nx, ny);
      }

      for (var val = 1; val <= 9; ++val) {
        if (put(x, y, val)) {
          dfs(nx, ny);
          unput(x, y, val);
        }
      }
    }
    
    for(var x = 0; x < 9; ++x) {
      for(var y = 0; y < 9; ++y) {
        if (public[x][y]) {
          put(x, y, private[x][y]);
        }
      }
    }
    dfs(0, 0);
    print('numsols=', cnt);
    return cnt == 1;
  }

  for(var it = 0; it < 3 && to_try.length > 0; ++it) {    
    var obj = to_try.pop();
    var x = obj.x, y = obj.y;
    print('hiding (', x, ',', y, ')');
    public[x][y] = 0;
    if (uniqueSolution()) {
      print('ok');
      return true;
    } else {
      print('makes puzzle nonunique');
      public[x][y] = 1;
    }
  }
  return false;
}

function unhideOne() {
  var x = rnd(9), y = rnd(9);
  for(var it = 0; it < 300; ++it) {
    if (public[x][y]) {
      x = rnd(9);
      y = rnd(9);
    } else {
      break;
    }
  }
  public[x][y] = 1;
}

window.onload = function() {
  createGameView();
  $('#generate').click(function() {
    generateSolvedGame()
    updateGameView();
    return false;
  });

  $('#hide-one').click(function() {
    try {
      hideOne();
    } catch(e) {
      print('error=', e);
    }
    updateGameView();
    return false;
  });

  $('#unhide-one').click(function() {
    try {
      unhideOne();
    } catch(e) {
      print('error=', e);
    }
    updateGameView();
    return false;
  });
}

cellId = function(x, y) { return 'cell-' + x + '-' + y }

function createGameView() {
  function getStyle(row, col, dir) {
    var pos = col;
    if (dir == 'right') { pos = 8 - col; } 
    else if (dir == 'top') { pos = row; } 
    else if (dir == 'bottom') { pos = 8 - row; }

    if (pos == 0) { return 'bold'; } 
    else if (pos % 3 == 0) { return 'thick'; }
    else { return 'light'; }
  }

  var styles = {
    bold: '5px solid',
    thick: '3px solid',
    light: '1px solid',
   }

  var table = $('#game-view');
  for(var row = 0; row < 9; ++row) {
    var tr = $('<tr>');
    for (var col = 0; col < 9; ++col) {
      var td = $('<td>');
      var cell = $('<div>').addClass('cell').attr('id', cellId(row, col));
      cell.append($('<input>').addClass('cell-input'));
      for(var dir of ['left', 'top', 'right', 'bottom']) {
        var style = getStyle(row, col, dir);
        cell.css('border-' + dir, styles[style]);
      }

      tr.append(td.append(cell));
      table.append(tr);
    }
  }
}

function updateGameView() {
  for (var row = 0; row < 9; ++row) {
    for (var col = 0; col < 9; ++col) {
      var cell = $('#' + cellId(row, col));
      var el = $('input', cell);
      el.val(private[row][col]);
      if (public[row][col] == 0) {
        el.addClass('cell-input');
        el.removeClass('cell-output');
      } else {
        el.addClass('cell-output');
        el.removeClass('cell-input');
      }
    }
  }
}
