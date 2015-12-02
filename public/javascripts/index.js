print = console.log.bind(console);

hide = function(el) { el.addClass('hidden') }
unhide = function(el) { el.removeClass('hidden') }

var socket;
var playerInfo;
var gameInfo;
var defaultColors = {
  0: 'red',
  1: 'blue',
  2: 'green',
  3: 'orange',
  4: 'purple',
}
var myPid;
var myGid;
var startTime;
var solved = false;
var customColors = {};

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function random(n) {
  return Math.floor(n*Math.random());
}

function randomColor() {
  return 'gray'; // truly random color generator
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

cellId = function(x, y) { return 'cell-' + x + '-' + y }

function animate(ev) {
  var guessObj = ev.guessObj, result = ev.result;
  // guessObj: {square}, result: "correct" or "incorrect"
  var square = $('#' + cellId(guessObj.square.row, guessObj.square.col))

  var obj = $('<div>');
  var color;
  if (result == 'correct') {
    obj.html("+1");
    color = 'green';
  } else {
    obj.html("-3");
    color = 'red';
  }

  $('body').append(obj);
  obj.css('font-size','20px');
  obj.css('position','absolute');
  obj.offset({
    left: square.offset().left + square.width() / 2 - obj.width() / 2, 
    top: square.offset().top + square.height() / 4,
  });
  obj.css({
    'opacity': 100,
    'color': color,
    'text-shadow': '1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, -1px 0 0 #000',
  });
  obj.animate({
    'opacity': 0,
    'top': '-='+(100+random(100))+'px', 
    'left': '-='+(random(200)-100)+'px',
  }, 1000, 'swing', function() {
    $(this).remove();
  });
}

function doGuess(guessObj) {
  // guessObj: {square: {row: ., col: .}, guess};
  // perhaps do some validation here
  socket.emit('guess', guessObj);
}

function updateColors() {
  $('.cell-input').css({color: getColor(myPid)});
}

function register(pid) {
  myPid = pid;
  updateColors();
}

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
    }
    table.append(tr);
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
  var completed = 0;
  var giveNextFocus = false;
  for (var x = 0; x < 9; ++x) {
    for (var y = 0; y < 9; ++y) {
      var cellInfo = _gameInfo[x][y];
      if (cellInfo.rank != 0) {
        ++completed;
      }
      var cell = $('#' + cellId(x, y));  
      if (gameInfo != null) {
        var old = gameInfo[x][y];
        if (cellInfo.rank == 0) {
          if (giveNextFocus) {
            $('.cell-input', cell).focus();
            giveNextFocus = false;
          }
          continue;
        } else if (old.rank == cellInfo.rank && old.source == cellInfo.source) {
          continue;
        }
        var prv = $('.cell-input', cell);
        print('prv =', prv);
        if (prv != null && prv.is(":focus")) {
          if (cellInfo.source == myPid) {
            // give next input focus.
            giveNextFocus = true;
          } else {
            // remove focus to avoid accidentally backspacing
            $('#dummy-input').focus();
          }
        }
        print('updating x=', x, 'y=', y, 'prev=', gameInfo[x][y], 'new=',cellInfo);
        cell.empty();

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
            var g = $('input', el).val();
            if (g.length != 1) {
              $.jGrowl('Invalid guess');
              return false;
            }
            var guess = parseInt($('input', el).val());
            if (isNaN(guess)) {
              $.jGrowl('Invalid guess');
              return false;
            }
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

  if (completed == 81) {
    unhide($('#new-game'));
    if (giveNextFocus) {
      $('#dummy-input').focus();
    }
    solved = true;
  } else {
    hide($('#new-game'));
  }

  gameInfo = _gameInfo;
}

function updateTimer() {
  if (!solved) {
    var el = $('#timer');
    function pad(num, len) {
      var s = '' + num;
      while (s.length < len) {
        s = '0' + s;
      }
      return s;
    }
    var curTime = new Date().getTime();
    var elapsed = curTime - startTime;
    var millis = pad(elapsed % 1000, 3); elapsed = (elapsed - millis) / 1000;
    var secs = pad(elapsed % 60, 2); elapsed = (elapsed - secs) / 60;
    var mins = pad(elapsed % 60, 2); elapsed = (elapsed - mins) / 60;
    var hrs = pad(elapsed % 24, 2); elapsed = (elapsed - hrs) / 24;
    var days = elapsed;

    var time_str;
    if (days != 0) {
      time_str = "{0}:{1}:{2}:{3}".format(days, hrs, mins, secs, millis);
    } else if (hrs != '00') {
      time_str = "{1}:{2}:{3}".format(days, hrs, mins, secs, millis);
    } else {
      time_str = "{2}:{3}".format(days, hrs, mins, secs, millis);
    }
    el.val(time_str);
    setTimeout(updateTimer, 1);
  }
}

window.onload = function() {
  myGid = $.url().param('gid');
  createGameView();
  socket = io();
  socket.emit('conn', myGid);
  socket.on('updatePlayers', updatePlayers);
  socket.on('updateGame', updateGame);
  socket.on('updateTime', function(_startTime) {
    startTime = _startTime;
  });
  socket.on('register', register);
  socket.on('err', function(err) {
    print('error=', err);
    $.jGrowl(err.reason);
  });
  socket.on('logout', function() {
    print('logout');
    myPid = null;
  });
  socket.on('rename', function() {
    // set name to username?
  });

  socket.on('conn', function() {
    print('connected!');
    socket.emit('refresh');
    updateTimer();
  });
  socket.on('guess', function(obj) {
    print('guess result:', obj);
    animate(obj);
  });

  $('#username').submit(function() {
    return false;
  });

  $('#register').click(function() {
    if ($('#register').hasClass('hidden')) {
      $('#rename').click();
      return false;
    }
    var username = $('#username').val();
    username = $.trim(username);
    if (username.length == 0) {
      $.jGrowl('Name is empty');
      print('name is empty');
      return false;
    }

    socket.emit('register', username);
    print('tried to register');
    return false;
  });

  $('#rename').click(function() {
    var username = $('#username').val();
    username = $.trim(username);
    if (username.length == 0) {
      $.jGrowl('Name is empty');
      print('name is empty');
      return false;
    }
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

