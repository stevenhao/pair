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

function generateSolvedGame() {
  private = [[4, 3, 5, 7, 6, 8, 9, 1, 2],
             [2, 7, 6, 9, 1, 5, 3, 4, 8],
             [8, 9, 1, 4, 3, 2, 5, 6, 7],
             [6, 2, 4, 5, 8, 3, 7, 9, 1],
             [9, 5, 8, 6, 7, 1, 4, 2, 3],
             [3, 1, 7, 2, 9, 4, 8, 5, 6],
             [5, 4, 3, 8, 2, 6, 1, 7, 9],
             [1, 6, 9, 3, 5, 7, 2, 8, 4],
             [7, 8, 2, 1, 4, 9, 6, 3, 5]];
  public = fillGrid(9, 9, 1);
}

function hideOne() {
  function rnd() {
    return Math.floor(9 * Math.random());
  }

  function countSolutions(public, x, y) {
    if (x == null) x = 0;
    if (y == null) y = 0;
  }

  function uniqueSolution() {
    var rows = fillGrid(9, 10, 0), cols = fillGrid(9, 10, 0), squares = fillGrid(9, 10, 0);
    function put(x, y, val) {
      var sq = Math.floor(x / 3) * 3 + Math.floor(y / 3);
      if (rows[x][val] || cols[y][val] || squares[sq][val]) {
        return false;
      }
      rows[x][val] = cols[y][val] = squares[sq][val] = 1;
      return true;
    }

    function unput(x, y, val) {
      var sq = Math.floor(x / 3) * 3 + Math.floor(y / 3);
      rows[x][val] = cols[y][val] = squares[sq][val] = 0;
    }

    function dfs(x, y) { // returns # sols
      var nx = x, ny = y + 1;
      if (ny == 9) {
        ny = 0;
        ++nx;
      }
      if (nx == 9) {
        return 1;
      }

      var cnt = 0;
      for (var val = 1; val <= 9; ++val) {
        if (public[x][y] && (val != private[x][y])) {
          continue;
        }
        if (put(x, y, val)) {
          cnt += dfs(nx, ny);
          unput(x, y, val);
          if (cnt >= 2) break;
        }
      }
      return cnt;
      
    }
    var numsols = dfs(0, 0);
    print('numsols=', numsols);
    return numsols == 1;
  }

  var num_its = 300;
  for(var it = 0; it < num_its; ++it) {
    var x = rnd(), y = rnd();
    if (!(public[x][y])) continue;
    public[x][y] = 0;
    print('hiding (', x, ',', y, ')');
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

window.onload = function() {
  createGameView();
  $('#generate').click(function() {
    generateSolvedGame()
    updateGameView();
    return false;
  });

  $('#hide-one').click(function() {
    $(this).attr('disabled', 'disabled');
    try {
      hideOne();
    } catch(e) {
      print('error=', e);
    }
    updateGameView();
    $(this).removeAttr('disabled');
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
