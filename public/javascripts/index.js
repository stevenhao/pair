print = console.log.bind(console);

setView = function(view) { // hide everything but view
  hideView(myView);
  myView = view;
  unhideView(myView);
}

var socket, pid;
var userInfo;
var gameInfo;
var defaultColors = {
  0: 'black',
  1: 'red',
  2: 'blue',
  3: 'green',
  4: 'yellow',
}

var customColors = {};

function randomColor() {
  return 'gray'; // truly random number
}

function getColor(pid) { 
  if (!(pid in customColors)) {
    if (pid in defaultColors) {
      customColors[pid] = defaultColors[pid];
    } else {
      customColors[pid] = randomColor();
    }
  }
  return customColors[pid];
}

window.onload = function() {
  createGameView();
  socket = io();
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
      for(var dir of ['left', 'top', 'right', 'bottom']) {
        var style = getStyle(row, col, dir);
        cell.css('border-' + dir, styles[style]);
      }

      tr.append(td.append(cell));
      table.append(tr);
    }
  }
}

function updatePlayers(_userInfo) {
  userInfo = _userInfo;

  var table = $('');
  table.empty();
  for (var player in _userInfo) {
    var tr = $('<tr>');
    var td1 = $('<td>'), td2 = $('<td>'), td3 = $('<td>');
    // color, username, score

    td1.append(makeColorSquare(getColor(player.pid)));
    td2.append(player.username);
    td3.append(player.score);
    tr.append(td1).append(td2).append(td3);
    table.append(tr);
  }
  // updateObj: [{pid: ., username: ., score: .}]
}

function updateGame(_gameInfo) {
  gameInfo = _gameInfo;
  // gameObj: ar[9][9], ar[x][y] = {rank: , source: sourceObj}
  // sourceObj: 0 -> initially known, pid -> some pid
  for (var x = 0; x < 9; ++x) {
    for (var y = 0; y < 9; ++y) {
      var cellInfo = gameObj[x][y];
      var el = $('#' + cellId(x, y));
      var pid = cellInfo.source;
      if (pid != 0) {
        el.css({color: userInfo[pid].color});
      } else {
        el.css({color: 'black'});
      }

      if (rank != 0) {
        el.html(rank);
      } else {
        el.html('');
      }
    }
  }
}

function guess(guessObj) {
  // guessObj: {square: {row: ., col: .}, guess};
  socket.emit('guess', guessObj);
}