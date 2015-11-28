print = console.log.bind(console);

hide = function(el) { el.css('display', 'none') }
unhide = function(el) { el.css('display', 'inline-block') }
setView = function(view) { // hide everything but view
  hideView(myView);
  myView = view;
  unhideView(myView);
}

var socket;
var playerInfo;
var gameInfo;
var defaultColors = {
  0: 'red',
  1: 'blue',
  2: 'green',
  3: 'yellow',
}
var myPid;

var customColors = {};

function randomColor() {
  return 'gray'; // trule random color generator
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
  socket.on('updatePlayers', updatePlayers);
  socket.on('updateGame', updateGame);
  socket.on('register', register);
  socket.on('err', function(err) {
    print('error=', err);
  });
  socket.on('logout', function() {
    print('logout');
    myPid = null;
  });
  socket.on('rename', function() {
    // set name to username?
  });


  socket.emit('refresh');

  $('#register').click(function() {
    var username = $('#username').val();
    socket.emit('register', username);
    print('tried to register');
    return false;
  });
  $('#rename').click(function() {
    var username = $('#username').val();
    socket.emit('rename', username);
    print('tried to rename');
    return false;
  });
  $('#logout').click(function() {
    socket.emit('logout');
    print('tried to logout');
    return false;
  });
}

function updateColors() {
  $('.cell-input').css({color: getColor(myPid)});
}

function register(pid) {
  myPid = pid;
  updateColors();
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

function updatePlayers(_playerInfo) {
  playerInfo = _playerInfo;
  print('received player update', playerInfo);

  makeColorSquare = function(color) {
    var span = $('<span>').addClass('square');
    var unitSize = '20px';
    span.css({
        display: 'block',
        float: 'left',
        width: unitSize,
        height: unitSize,
        'background-color': color
    });
    return span;
  }

  var table = $('#player-list');
  table.empty();
  for (var pid in playerInfo) {
    var player = playerInfo[pid];
    var tr = $('<tr>');
    var td1 = $('<td>'), td2 = $('<td>'), td3 = $('<td>');
    // color, username, score

    td1.append(makeColorSquare(getColor(pid)));
    td3.append(player.score);
    td2.append(player.username);
    if (pid == myPid) {
      td2.append(' (You)');
      td2.addClass('player-me');
      td3.addClass('player-me');
    } else {
    }

    if (!player.online) {
      td2.append(' (offline)')
      td2.addClass('offline');
    }
    tr.append(td1).append(td2).append(td3);
    table.append(tr);
  }
  // updateObj: [{pid: ., username: ., score: .}]

  if (myPid == null) {
    hide($('#rename'));
    hide($('#logout'));
    unhide($('#register'));
  } else {
    hide($('#register'));
    unhide($('#rename'));
    unhide($('#logout'));    
  }
}

function updateGame(_gameInfo) {
  print('received game update', _gameInfo);

  // gameObj: ar[9][9], ar[x][y] = {rank: , source: sourceObj}
  // sourceObj: -1 -> initially known, pid -> some pid
  for (var x = 0; x < 9; ++x) {
    for (var y = 0; y < 9; ++y) {
      var cellInfo = _gameInfo[x][y];
      var cell = $('#' + cellId(x, y));  
      if (gameInfo != null) {
        var old = gameInfo[x][y];
        if (old.rank == cellInfo.rank && old.source == cellInfo.source) {
          continue;
        }
        print('updating x=', x, 'y=', y, 'prev=', gameInfo[x][y], 'new=',cellInfo);
        cell.empty(); // should be already empty

        var el = $('<span>').addClass('cell-output');
        var pid = cellInfo.source;
        if (pid != -1) {
          el.css({color: getColor(pid)});
        } else {
          el.css({color: 'black'});
        }
        el.append(cellInfo.rank);
        cell.append(el);
      } else {
        cell.empty(); // should be already empty
        if (cellInfo.rank != 0) {
          var el = $('<span>').addClass('cell-output');
          var pid = cellInfo.source;
          if (pid != -1) {
            el.css({color: getColor(pid)});
          } else {
            el.css({color: 'black'});
          }
          el.append(cellInfo.rank);
          cell.append(el);
        } else {
          var form = $('<form>').addClass('cell-input').attr('x', x).attr('y', y);
          form.submit(function() {
            var el = $(this);
            var guess = parseInt($('input', el).val());
            print('submitting guess=', guess);
            var guessObj = {
              square: {row: el.attr('x'), col: el.attr('y')},
              guess: guess,
            };
            doGuess(guessObj);
            return false;
          });
          var el = $('<input>').addClass('cell-input');
          cell.append(form.append(el));
        }
      }
    }
  }

  gameInfo = _gameInfo;

}

function doGuess(guessObj) {
  // guessObj: {square: {row: ., col: .}, guess};
  // perhaps do some validation here
  socket.emit('guess', guessObj);
}