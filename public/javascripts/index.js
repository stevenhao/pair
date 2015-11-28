myPid = null;
myGid = null;
myView = 'login';
selectedCard = null;
myUsername = null;
print = console.log.bind(console);
messageCounter = 0;

unhide = function(sel) {
  sel.removeClass('hidden');
}

hide = function(sel) {
  sel.addClass('hidden');
}

hideView = function(view) {
  hide($('#' + view + '-view, #' + view + '-view-nav'));
}

unhideView = function(view) {
  unhide($('#' + view + '-view, #' + view + '-view-nav'));
}

setView = function(view) { // hide everything but view
  hideView(myView);
  myView = view;
  unhideView(myView);
}

window.onload = function() {
  socket = io();
  console.log('index.js is alive.');
  myView = 'login';
  hideView('lobby');
  hideView('game');
  hideView('wait');

  // Login Listeners
  socket.on('login success', function(lobby_data) {
    if(myView != 'login')
      return;

    myUsername = lobby_data.username;
    renderLobby(lobby_data.games, lobby_data.openGames);
    setView('lobby');

    // Resets form data
    $('#username, #password').val('');
    $('#new-password, #new-confirm-password, #new-username').val('');
    hide($('#register-error'));
    $('#user-auth').removeClass('has-error');
  });

  socket.on('login denied', function(message) {
    $('#user-auth').addClass('has-error');
    $('#password').val('');
    console.log('Login Denied');
  });

  socket.on('user_register denied', function(message) {
    $('#register-error').html(message);
    unhide($('#register-error'));
    $('#new-password, #new-confirm-password, #new-username').val('');
  });

  socket.on('user_register success', function(user_info) {
    socket.emit('login', user_info);
  })

  socket.on('logout success', function() {
    if(myView =='login')
      return;
    
    myGid = null;
    myPid = null;
    myUsername = null;

    setView('login');
  });

  // Login Javascript
  $('#login-submit').click(function() {
    var username = $('#username').val();
    var password = $('#password').val();
    if (username == '') {
      return false;
    }
    socket.emit('login', {'username':username, 'password':password});
    return false;
  });

  $('#register').click(function() {
    var username = $('#new-username').val();
    var password = $('#new-password').val();
    var confirm_password = $('#new-confirm-password').val();
    hide($('#register-error'));

    if(password != confirm_password) {
      $('#register-error').html('Passwords do not match.');
      unhide($('#register-error'));
      $('#new-password').val('');
      $('#new-confirm-password').val('');
      return false;
    }

    if(username == '')
      return false;

    // TODO: hash password instead of sending as plaintext
    socket.emit('user_register', {'username':username, 'password':password});
    return false;
  });

  $('.logout').click(function() {
    if(myView == 'login') {
      return false;
    }

    socket.emit('logout');
    return false;
  });

  // Lobby Listeners
  socket.on('register success', function(_gameInfo) {
    gameInfo = _gameInfo;
    if(myView != 'lobby' && !(myView == 'wait' && gameInfo.gid == myGid))
      return;

    print('register success,', gameInfo);
    messageCounter = 0;
    myGid = gameInfo.gid;
    myPid = gameInfo.pid;

    renderGame();
    setView('game');

  });

  socket.on('join success', function(joinInfo) {
    if(myView != 'lobby') return;

    myGid = joinInfo.gid;

    renderWait(joinInfo);
    setView('wait');
  });

  socket.on('create success', function(gid) {
    socket.emit('join', gid);
  });

  socket.on('updateGameList', function(gameList) {
    if(myView != 'lobby') return;
    updateLobby(gameList.games, gameList.openGames);
  });
  
  // Lobby Javascript
  $('#create-game').click(function() {
    if (myView != 'lobby') return;
    socket.emit('create', {
      'num_players': 4,
      'num_colors': 2,
      'num_ranks': 12,
    });
    return false;
  });

  $('#wait-back').click(function() {
    if(myView != 'wait') return;

    socket.emit('wait_back');
    return false;
  });

  // Wait Listeners
  socket.on('wait_back success', function(lobby_data) {
    if(myView != 'wait') return;
    
    renderLobby(lobby_data['games'], lobby_data['openGames']);
    myGid = null;

    setView('lobby');
  });

  socket.on('wait update', function(waitInfo) {
    if (myView != 'wait' || myGid != waitInfo['gid']) return;

    updateWait(waitInfo);
  });

  socket.on('start', function(startInfo) {
    if (myView == 'wait' && myGid == startInfo['gid']) {
      if(startInfo['usernames'].indexOf(myUsername) != -1) {
        socket.emit('register', startInfo['gid']);
      }
    }
  });

  // Wait Javascript
  $('#start-game').click(function() {
    socket.emit('start');
  })

  // Game Listeners
  socket.on('update', function(_gameInfo) {
    gameInfo = _gameInfo;
    if(myView == 'game') {
      updateGame();
    }
  });

  for(game_event of ['pass success', 'guess success', 'flip success', 'clam success']) {
    socket.on(game_event, function() {
      socket.emit('update');
    });
  }

  socket.on('update', function(_gameInfo) {
    gameInfo = _gameInfo;
    if(myView == 'game') {
      updateGame();
    }
    deselect();
  });

  socket.on('game_back success', function(lobby_data) {
    if(myView != 'game') return;
    
    renderLobby(lobby_data.games, lobby_data.openGames);
    myGid = null;
    myPid = null;

    setView('lobby');
  });

  $('#game-back').click(function() {
    if(myView != 'game') return;

    socket.emit('game_back');
    return false;
  });
};

renderLobby = function(games, open_games) {
  $('#active-games').html('');
  $('#open-games').html('');
  $('#my-games').html('');
  for(gameId in games) {
    var game = games[gameId];
    var tr = $('<tr>').addClass('clickable').addClass('game-cell').attr('gid', gameId);
    var gidCell = $('<td>').append(gameId);
    var hostCell = $('<td>').append(game.host);
    var joined = game.usernames.indexOf(myUsername) != -1 || myUsername == game.host;
    var joinedCell = $('<td>').append(joined ? 'Yes': 'No');
    $('#active-games').append(tr.append(gidCell).append(hostCell).append(joinedCell));
    if(joined) {
      tr = $('<tr>').addClass('clickable').addClass('game-cell').attr('gid', gameId);
      gidCell = $('<td>').append(gameId);
      hostCell = $('<td>').append(game.host);
      statusCell = $('<td>').append('Active');
      $('#my-games').append(tr.append(gidCell).append(hostCell).append(statusCell));
    }
  }

  for(gameId in open_games) {
    var game = open_games[gameId];
    var tr = $('<tr>').addClass('clickable').addClass('open-game-cell').attr('gid', gameId);
    var gidCell = $('<td>').append(gameId);
    var hostCell = $('<td>').append(game.host);
    var joined = game.usernames.indexOf(myUsername) != -1 || myUsername == game.host;
    var joinedCell = $('<td>').append(joined ? 'Yes': 'No');

    var openSpots = 0;
    for(var i = 0; i < game.usernames.length; ++i) {
        if(game.usernames[i] == null)
            openSpots++;
    }
    var openSpotsCell = $('<td>').append(openSpots);

    $('#open-games').append(tr.append(gidCell).append(hostCell).append(joinedCell).append(openSpotsCell));
    if(joined) {
      tr = $('<tr>').addClass('clickable').addClass('open-game-cell').attr('gid', gameId);
      gidCell = $('<td>').append(gameId);
      hostCell = $('<td>').append(game.host);
      statusCell = $('<td>').append('Open');
      $('#my-games').append(tr.append(gidCell).append(hostCell).append(statusCell));
    }
  }

  $('.game-cell').click(function() {
    var gameId = $(this).attr('gid');
    socket.emit('register', gameId);
  });

  $('.open-game-cell').click(function() {
    var gameId = $(this).attr('gid');
    socket.emit('join', gameId);
  });
  $('#lobby-greeting').html('Welcome, '+myUsername+'!');
}

updateLobby = function(games, open_games) {
  renderLobby(games, open_games);
}


playersListCellId = function(pid) {
  return 'players-list-cell-'+pid;
}

renderWait = function(joinInfo) {
  $('#players-list').html('');
  $('#game-id').html(joinInfo.gid)
  $('#host').html(joinInfo.host);
  var pids = [0, 2, 1, 3];
  for (var i = 0; i < 4; ++i) {
    var tr = $('<tr>');
    var td = $('<td>').addClass('players-list-cell clickable');
    td.attr('id', playersListCellId(pids[i])).attr('pid', pids[i]);
    $('#players-list').append(tr.append(td));
  }

  $('.players-list-cell').click(function() {
    var pid = $(this).attr('pid');
    socket.emit('add_user', pid);
  });

  $('#wait-greeting').html('Welcome, '+myUsername+'!');
  updateWait(joinInfo);
}

updateWait = function(joinInfo) {
  var filled = true;
  for (var i = 0; i < joinInfo.usernames.length; ++i) {
    var team = i%2 == 0 ? 'Team A' : 'Team B';
    if (joinInfo.usernames[i] == null) {
      $('#' + playersListCellId(i)).html('Join '+team);
      filled = false;
    } else{
      $('#' + playersListCellId(i)).html('<b>'+team+': </b>'+joinInfo.usernames[i]);
    }
  }

  if (myUsername == joinInfo.host && filled) {
    unhide($('#start-game'));
  }
  else {
    hide($('#start-game'));
  }
}

// game code

partner = function(x) {
  return (x + 2) % 4;
}

cardId = function(pid, idx) {
  return 'card-' + pid + '-' + idx;
}

nameId = function(pid) {
  return 'nameTag-' + pid;
}

renderGame = function() {
  createNameEl = function() {
    var td = $('<td>').addClass('player-name');
    return td;
  }

  createNoteEl = function() {
    var noteEl = $('<textarea>').addClass('notes').val('...');
    noteEl.focus(function() {
      if ($(this).val() == '...') {
        $(this).val('');
      }
    });
    noteEl.blur(function() {
      if ($(this).val() == '') {
        $(this).val('...');
      }
      updateClamOpacity();
    });
    return noteEl;
  }

  createCardEl = function() {
    var td = $('<td>').addClass('card').addClass('clickable');
    td.append(createNoteEl());
    return td;
  }

  createHandEl = function(pid) {
    var handEl = $('<tr>');
    var nameEl = createNameEl().attr('id', nameId(pid));
    handEl.append(nameEl.css({'font-size':'large','font-weight':'bold'}));

    for (var idx = 0; idx < 6; ++idx) {
      var cardEl = createCardEl().attr('id', cardId(pid, idx)).attr('pid', pid).attr('idx', idx);
      cardEl.dblclick(function(e) {
        selectCard($(this));
        return true;
      });

      cardEl.bind('touchy-longpress', function() {
        selectCard($(this));
        return true;
      });
      handEl.append(cardEl);
    }
    return handEl;
  }

  createSelectEl = function() {
    var tr = $('<tr>').attr('id', 'select');
    tr.append($('<td>'));
    for (var i = 1; i <= 12; i += 2) {
      var td = $('<td>');
      tr.append(td);
      for (var j = i; j <= i + 1; ++j) {
        var div = $('<div>').addClass('num');
        if (j % 2 == 1) {
          div.addClass('left-num');
        } else {
          div.addClass('right-num');
        }
        td.append(div.append($('<span>').append(j)));

        div.attr('value', j);
        div.click(function() {
          actionGuess($(this).attr('value'));
        });
      }
    }
    return tr;
  }

  createSubmitEl = function() {
    var tr = $('<tr>');
    var td = $('<td>').attr('colspan', '6');
    var button = $('<button>').attr('id', 'submit').addClass('btn btn-default btn-primary');
    tr.append($('<td>'));
    tr.append(td.append($('<div style="margin:auto;width:150px">').append(button.append('Submit'))));
    button.click(function() {
      var phase = gameInfo.public.phase;
      if (phase == 'pass') {
        actionPass();
      } else if (phase == 'flip') {
        actionFlip();
      }
    });
    return tr;
  }

  createClamEl = function() {
    var tr = $('<tr>');
    var td = $('<td>').attr('colspan', '6');
    var button = $('<button>').attr('id', 'clam').addClass('btn btn-default btn-primary');
    tr.append($('<td>'));
    tr.append(td.append($('<div style="margin:auto;width:150px">').append(button.append('Clam'))));
    button.click(function() {
      actionClam();
    });
    return tr;
  }

  createStatusEl = function() {
    var tr = $('<tr>');
    var td = $('<td>');
    var span = $('<span>');
    td.attr('colspan', '6').css({'text-align':'center'});
    span.attr('id', 'status').css({'font-size':'30px','font-weight':'bold'});
    span.append("It's your turn to pass!");
    tr.append($('<td>')).append(td.append(span));
    return tr;
  }

  var table = $('#game-layout');
  table.empty();

  table.append(createStatusEl());
  var pids = [myPid, (myPid + 2) % 4, (myPid + 1) % 4, (myPid + 3) % 4];
  for (var pid of pids) {
    table.append(createHandEl(pid));
  }

  table.append(createSelectEl());
  table.append(createSubmitEl());
  table.append($('<tr id="filler">'));
  table.append(createClamEl());

  $('#history-text').empty();
  $('#game-greeting').html('Your Game ID is '+myGid+'.');

  updateObjects();
  updateButtonOpacity();
  updateClamOpacity();
}

updateObjects = function() {
  updateCardEl = function(cardEl, cardInfo) {
    // fill card backs
    if (cardInfo.color == 1) {
      cardEl.addClass('red');
      cardEl.removeClass('black');
    } else { // color == 2
      cardEl.addClass('black');
      cardEl.removeClass('red');
    }

    // fill card ranks
    var rank = cardInfo.rank;
    if (rank != 0) {
      cardEl.addClass('known');
      cardEl.removeClass('unknown');
      cardEl.html(rank);
    } else {
      cardEl.removeClass('known');
      cardEl.addClass('unknown');
    }

    // set card flipped
    if (cardInfo.flipped) {
      cardEl.addClass('flipped');
    } else {
      cardEl.removeClass('flipped');
    }
  }

  updateStatusEl = function(el) {
    var turn = parseInt(gameInfo.public.turn);
    var phase = gameInfo.public.phase;
    var names = gameInfo.usernames;
    var winner = gameInfo.public.winner;
    createStatusMessage = function() {
      if (phase == 'pass') {
        var pid = partner(turn);
        return names[pid] + ' to pass';
      } else if (phase == 'guess') {
        var pid = turn;
        return names[pid] + ' to guess';
      } else if (phase == 'flip') {
        var pid = turn;
        return names[pid] + ' to flip';
      } else if (phase == 'over') {
        var msg = winner == myPid %2 ? ' win!' : ' lose!';
        return 'Game Over! You '+msg;
      }
    }

    el.html(createStatusMessage());
  }

  updateHistoryEl = function(el) {
    var history = gameInfo.public.history;
    while (messageCounter < history.length) {
      el.append($('<tr>').append($('<td>').append(history[messageCounter].message)));
      ++messageCounter;
    }
  }

  updateButtonVisibility = function(select, submit, filler, clam) {
    for (var el of [select, submit, filler]) {
      el.addClass('hidden');
    }

    var turn = parseInt(gameInfo.public.turn);
    var phase = gameInfo.public.phase;
    var pid = turn;
    if (phase == 'pass') {
      pid = partner(turn);
    }

    if (pid == myPid) {
      if (phase == 'pass') {
        submit.removeClass('hidden');
        submit.html('Pass');
      } else if (phase == 'flip') {
        submit.removeClass('hidden');
        submit.html('Flip');
      } else if (phase == 'guess') {
        select.removeClass('hidden');
      }
    } else {
      filler.removeClass('hidden');
    }

    if (phase == 'over') {
      clam.addClass('hidden');
    } else {
      clam.removeClass('hidden');
    }
  }

  updateHandEl = function(pid) {
    // fill name
    var nameEl = $('#' + nameId(pid));
    var name = gameInfo.usernames[pid];
    nameEl.html(name);

    for(var idx = 0; idx < 6; ++idx) {
      var cardEl = $('#' + cardId(pid, idx));
      var cardInfo;
      var phase = gameInfo.public.phase;
      cardInfo = gameInfo.private[pid][idx];

      updateCardEl(cardEl, cardInfo);
    }
  }

  for(var pid = 0; pid < 4; ++pid) {
    updateHandEl(pid);
  }
  updateStatusEl($('#status'));
  updateHistoryEl($('#history-text'));
  updateButtonVisibility($('#select'), $('#submit'), $('#filler'), $('#clam'));
}

updateButtonOpacity = function() {
  var turn = parseInt(gameInfo.public.turn);
  var phase = gameInfo.public.phase;
  var pid = turn;
  if (phase == 'pass') {
    pid = partner(turn);
  }

  var select = $('#select'), submit = $('#submit');
  if (pid == myPid) {
    if (phase == 'pass') {
      if (canPass()) {
        submit.removeAttr('disabled');
        submit.removeClass('disabled');
      } else {
        submit.attr('disabled', '1');
        submit.addClass('disabled');
      }
    } else if (phase == 'flip') {
      if (canFlip()) {
        submit.removeAttr('disabled');
        submit.removeClass('disabled');
      } else {
        submit.attr('disabled', '1');
        submit.addClass('disabled');

      }
    } else if (phase == 'guess') {
      $('.num').each(function() {
        var el = $(this);
        var rank = el.attr('value');
        if (canGuess(rank)) {
          el.removeClass('disabled');
        } else {
          el.addClass('disabled');
        }
      });
    }
  }
}

updateClamOpacity = function() {
  var clam = $('#clam');

  if (canClam()) {
    clam.removeAttr('disabled');
    clam.removeClass('disabled')
  } else {
    clam.attr('disabled', 1);
    clam.addClass('disabled');
  }
}

updateGame = function() {
  updateObjects();
  updateButtonOpacity();
  updateClamOpacity();
}

selectCard = function(card) {
  console.log('select card', card);
  if (card.hasClass('selected')) {
    card.removeClass('selected');
    selectedCard = null;
  } else {
    if (selectedCard) {
      selectedCard.removeClass('selected');
    }

    card.addClass('selected');
    selectedCard = card;
  }
  updateButtonOpacity();
}

deselect = function() {
  if (selectedCard != null) {
    selectedCard.removeClass('selected');
    selectedCard = null;
  }
  updateButtonOpacity();
}

validClamObj = function(guessObj) {
  for (var curList of guessObj) {
    for (var guess of curList) {
      if (isNaN(guess)) {
        return false;
      }
    }
  }
  return true;
}

getClamObj = function() {
  var clamObj = [];
  for (var pid = 0; pid < 4; ++pid) {
    var curList = [];
    for (var idx = 0; idx < 6; ++idx) {
      var cardEl = $('#' + cardId(pid, idx));
      var guess = 0;
      if (cardEl.hasClass('known')) {
        guess = parseInt(cardEl.html());        
      } else {
        var notesEl = $('textarea', cardEl);
        guess = parseInt(notesEl.val());
      }
      curList.push(guess);
    }
    clamObj.push(curList);
  }
  return clamObj;
}

canGuess = function(rank) {
  getColor = function(cardEl) {
    if (cardEl.hasClass('red')) {
      return 1;
    } else {
      return 2;
    }
  }

  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    if (pid != myPid && pid != partner(myPid)) {
      var color = getColor(selectedCard);
      var ok = true;
      $('.card.flipped').each(function() {
        var el = $(this);
        if (el.html() == rank && getColor(el) == color) {
          ok = false;
        }
      });
      return ok;
    }
  }
}

canPass = function() {
  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    return pid == myPid;
  }
}

canFlip = function() {
  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    return pid == myPid;
  }
}

canClam = function() {
  var clamObj = getClamObj();
  var ok = validClamObj(clamObj);
  return ok;
}

actionGuess = function(rank) {
  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    var idx = parseInt(selectedCard.attr('idx'));
    if (pid != myPid && pid != partner(myPid)) {
      var guessObj = {'target_id': pid, 'target_card': idx, 'rank': rank};
      socket.emit('guess', guessObj);
      print('Guessing,', guessObj);
    }
  }
}

actionPass = function() {
  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    var idx = parseInt(selectedCard.attr('idx'));
    if (pid == myPid) {
      var passObj = {'card': idx};
      socket.emit('pass', passObj);
      print('Passing,', passObj);
    }
    deselect();
  }
}

actionFlip = function() {
  if (selectedCard != null) {
    var pid = parseInt(selectedCard.attr('pid'));
    var idx = parseInt(selectedCard.attr('idx'));
    if (pid == myPid) {
      var flipObj = {'card': idx};
      socket.emit('flip', flipObj);
      print('Flipping,', flipObj);
    }
  }
}

actionClam = function() {
  var clamObj = getClamObj();
  print("Clamming", clamObj);

  var ok = validClamObj(clamObj);
  if (!ok) {
    print("clam is not ok");
  } else {
    print("clam is ok, sending to server")
    socket.emit('clam', clamObj);
  }
}

