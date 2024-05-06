var moveNotation = [];
var socket = io();
var mmcode = null;
var team = null;
var username = null;
var oppUsername = null;
var transferMove = {
    move: null,
    pieceID: null,
    tileID: null
};
getUser();

        var testRoom = document.getElementById('Test-User');
        var moveButton = document.getElementById('make-move');

        testRoom.addEventListener('click', () => {
          mmcode = $('#mmcode').val();

          if(mmcode) {
            socket.emit('join-room', mmcode);
            socket.emit('get-team', mmcode);
          } else {
            socket.emit('join-room', 2000);
          }
        });

        function getUser() {
          $.ajax({
            url: chessURL + "/user",
            type: "get",
            success: function(response){
              var data = JSON.parse(response);
              if(data.msg == "SUCCESS"){
                username = data.username;
              } else {
                alert(data.msg);
              }
            },
            error: function(err){
                    console.log(err);
                }
          });
          return false;
        }

        function allowDrop(ev) { 
            ev.preventDefault(); 
        } 
  
        function drag(ev) { 
            ev.dataTransfer.setData("id", ev.target.id);
            ev.dataTransfer.setData("name", ev.target.name);
            ev.dataTransfer.setData("from", ev.target.parentNode.id);
        } 
  
        function drop(ev) { 
            ev.preventDefault(); 
            var data = ev.dataTransfer.getData("id"); 
            var name = ev.dataTransfer.getData("name");
            var tile = ev.target.id;
            var from = ev.dataTransfer.getData("from");
            if(name == "" && from[0] != tile[0]) from = (from[0] + 'x');
            else if(name == "") from = "";
            if(tile.length > 2) {
              tile = ev.target.parentNode.id;
            }
            var move = (name + from + tile);
            if(name == "K" && tile[0] == "g" && from[0] == "e") move = "O-O";
            else if(name == "K" && tile[0] == "c" && from[0] == "e") move = "O-O-O";
            console.log(move);
            if(name == "" && ((team == "WHITE" && tile[1] == 8) || (team == "BLACK" && tile[1] == 1))) {
                transferMove.move = move;
                transferMove.pieceID = data;
                transferMove.tileID = tile;
                openForm();
            } else makeMove(move, true, data, tile);
        }

        function updateBoard(pieceID, tileID, special) {
          var tile = document.getElementById(tileID);
          if(tile.hasChildNodes()) {
            tile.replaceChild(document.getElementById(pieceID), tile.firstChild);
          } else {
            tile.appendChild(document.getElementById(pieceID));
          }
          if(special == "O-O") {
            if(tileID[1] == 1) document.getElementById("f1").appendChild(document.getElementById("h1rook"));
            else document.getElementById("f8").appendChild(document.getElementById("h8rook"));
          } else if(special == "O-O-O") {
                if(tileID[1] == 1) document.getElementById("d1").appendChild(document.getElementById("a1rook"));
                else document.getElementById("d8").appendChild(document.getElementById("a8rook"));
          } else if(special == "ENPAS") {
                var delCol = tileID[0];
                var delRow = parseInt(tileID[1]);
                if(pieceID[1] == "2") delRow -= 1;
                else delRow += 1;
                var delPawn = (delCol + delRow);
                document.getElementById(delPawn).removeChild(document.getElementById(delPawn).firstChild);
          } else if(special) {
            switch(special[0]) {
                case "Q":
                    if(special[1] == "w") document.getElementById(pieceID).src = "/client/images/white_queen.png";
                    else document.getElementById(pieceID).src = "/client/images/black_queen.png";
                    document.getElementById(pieceID).name = "Q";
                    break;
                case "R":
                    if(special[1] == "w") document.getElementById(pieceID).src = "/client/images/white_rook.png";
                    else document.getElementById(pieceID).src = "/client/images/black_rook.png";
                    document.getElementById(pieceID).name = "R";
                    break;
                case "N":
                    if(special[1] == "w") document.getElementById(pieceID).src = "/client/images/white_horse.png";
                    else document.getElementById(pieceID).src = "/client/images/black_knight.png";
                    document.getElementById(pieceID).name = "N";
                    break;
                case "B":
                    if(special[1] == "w") document.getElementById(pieceID).src = "/client/images/white_bishop.png";
                    else document.getElementById(pieceID).src = "/client/images/black_bishop.png";
                    document.getElementById(pieceID).name = "B";
                    break;
            }
          }
        }

        socket.on('recieve-move', function(move, pieceID, tileID) {
          makeMove(move, false, pieceID, tileID);
        });

        socket.on('recieve-username', function(oppUser) {
          oppUsername = oppUser;
          gameStart(team, username, oppUsername, mmcode);
        });

        socket.on('assign-team', function(newTeam) {
          team = newTeam;
          socket.emit('player-check', mmcode);
        });

        socket.on('give-team', function() {
          socket.emit('share-team', team, mmcode);
        });

        socket.on('give-username', function() {
          socket.emit('send-username', username, mmcode);
        });

function blackBoard() {
    html = '<table class="chess-board" ondrop="drop(event)" ondragover="allowDrop(event)">';
    html += '<tbody>';
    html += '<tr>';
    html += '<th></th>';
    html += '<th>h</th>';
    html += '<th>g</th>';
    html += '<th>f</th>';
    html += '<th>e</th>';
    html += '<th>d</th>';
    html += '<th>c</th>';
    html += '<th>b</th>';
    html += '<th>a</th>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>1</th>';
    html += '<td class="light" id="h1"><img src="/client/images/white_rook.png" id="h1rook" name="R" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="g1"><img src="/client/images/white_horse.png" id="g1knight" name="N" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="f1"><img src="/client/images/white_bishop.png" id="f1bishop" name="B" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="e1"><img src="/client/images/white_king.png" id="e1king" name="K" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="d1"><img src="/client/images/white_queen.png" id="d1queen" name="Q" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="c1"><img src="/client/images/white_bishop.png" id="c1bishop" name="B" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="b1"><img src="/client/images/white_horse.png" id="b1knight" name="N" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="a1"><img src="/client/images/white_rook.png" id="a1rook" name="R" draggable="false" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>2</th>';
    html += '<td class="dark" id="h2"><img src="/client/images/white_pawn.png" id="h2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="g2"><img src="/client/images/white_pawn.png" id="g2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="f2"><img src="/client/images/white_pawn.png" id="f2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="e2"><img src="/client/images/white_pawn.png" id="e2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="d2"><img src="/client/images/white_pawn.png" id="d2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="c2"><img src="/client/images/white_pawn.png" id="c2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="b2"><img src="/client/images/white_pawn.png" id="b2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="a2"><img src="/client/images/white_pawn.png" id="a2pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>3</th>';
    html += '<td class="light" id="h3"></td>';
    html += '<td class="dark" id="g3"></td>';
    html += '<td class="light" id="f3"></td>';
    html += '<td class="dark" id="e3"></td>';
    html += '<td class="light" id="d3"></td>';
    html += '<td class="dark" id="c3"></td>';
    html += '<td class="light" id="b3"></td>';
    html += '<td class="dark" id="a3"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>4</th>';
    html += '<td class="dark" id="h4"></td>';
    html += '<td class="light" id="g4"></td>';
    html += '<td class="dark" id="f4"></td>';
    html += '<td class="light" id="e4"></td>';
    html += '<td class="dark" id="d4"></td>';
    html += '<td class="light" id="c4"></td>';
    html += '<td class="dark" id="b4"></td>';
    html += '<td class="light" id="a4"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>5</th>';
    html += '<td class="light" id="h5"></td>';
    html += '<td class="dark" id="g5"></td>';
    html += '<td class="light" id="f5"></td>';
    html += '<td class="dark" id="e5"></td>';
    html += '<td class="light" id="d5"></td>';
    html += '<td class="dark" id="c5"></td>';
    html += '<td class="light" id="b5"></td>';
    html += '<td class="dark" id="a5"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>6</th>';
    html += '<td class="dark" id="h6"></td>';
    html += '<td class="light" id="g6"></td>';
    html += '<td class="dark" id="f6"></td>';
    html += '<td class="light" id="e6"></td>';
    html += '<td class="dark" id="d6"></td>';
    html += '<td class="light" id="c6"></td>';
    html += '<td class="dark" id="b6"></td>';
    html += '<td class="light" id="a6"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>7</th>';
    html += '<td class="light" id="h7"><img src="/client/images/black_pawn.png" id="h7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="g7"><img src="/client/images/black_pawn.png" id="g7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="f7"><img src="/client/images/black_pawn.png" id="f7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="e7"><img src="/client/images/black_pawn.png" id="e7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="d7"><img src="/client/images/black_pawn.png" id="d7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="c7"><img src="/client/images/black_pawn.png" id="c7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="b7"><img src="/client/images/black_pawn.png" id="b7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="a7"><img src="/client/images/black_pawn.png" id="a7pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>8</th>';
    html += '<td class="dark" id="h8"><img src="/client/images/black_rook.png" id="h8rook" name="R" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="g8"><img src="/client/images/black_knight.png" id="g8knight" name="N" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="f8"><img src="/client/images/black_bishop.png" id="f8bishop" name="B" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="e8"><img src="/client/images/black_king.png" id="e8king" name="K" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="d8"><img src="/client/images/black_queen.png" id="d8queen" name="Q" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="c8"><img src="/client/images/black_bishop.png" id="c8bishop" name="B" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="b8"><img src="/client/images/black_knight.png" id="b8knight" name="N" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="a8"><img src="/client/images/black_rook.png" id="a8rook" name="R" draggable="true" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '</tbody>';
    html += '</table>';

    return html;
} 

function whiteBoard() {
    html = '<table class="chess-board" ondrop="drop(event)" ondragover="allowDrop(event)">';
    html += '<tbody>';
    html += '<tr>';
    html += '<th></th>';
    html += '<th>a</th>';
    html += '<th>b</th>';
    html += '<th>c</th>';
    html += '<th>d</th>';
    html += '<th>e</th>';
    html += '<th>f</th>';
    html += '<th>g</th>';
    html += '<th>h</th>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>8</th>';
    html += '<td class="light" id="a8"><img src="/client/images/black_rook.png" id="a8rook" name="R" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="b8"><img src="/client/images/black_knight.png" id="b8knight" name="N" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="c8"><img src="/client/images/black_bishop.png" id="c8bishop" name="B" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="d8"><img src="/client/images/black_queen.png" id="d8queen" name="Q" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="e8"><img src="/client/images/black_king.png" id="e8king" name="K" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="f8"><img src="/client/images/black_bishop.png" id="f8bishop" name="B" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="g8"><img src="/client/images/black_knight.png" id="g8knight" name="N" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="h8"><img src="/client/images/black_rook.png" id="h8rook" name="R" draggable="false" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>7</th>';
    html += '<td class="dark" id="a7"><img src="/client/images/black_pawn.png" id="a7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="b7"><img src="/client/images/black_pawn.png" id="b7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="c7"><img src="/client/images/black_pawn.png" id="c7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="d7"><img src="/client/images/black_pawn.png" id="d7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="e7"><img src="/client/images/black_pawn.png" id="e7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="f7"><img src="/client/images/black_pawn.png" id="f7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="g7"><img src="/client/images/black_pawn.png" id="g7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="h7"><img src="/client/images/black_pawn.png" id="h7pawn" name="" draggable="false" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>6</th>';
    html += '<td class="light" id="a6"></td>';
    html += '<td class="dark" id="b6"></td>';
    html += '<td class="light" id="c6"></td>';
    html += '<td class="dark" id="d6"></td>';
    html += '<td class="light" id="e6"></td>';
    html += '<td class="dark" id="f6"></td>';
    html += '<td class="light" id="g6"></td>';
    html += '<td class="dark" id="h6"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>5</th>';
    html += '<td class="dark" id="a5"></td>';
    html += '<td class="light" id="b5"></td>';
    html += '<td class="dark" id="c5"></td>';
    html += '<td class="light" id="d5"></td>';
    html += '<td class="dark" id="e5"></td>';
    html += '<td class="light" id="f5"></td>';
    html += '<td class="dark" id="g5"></td>';
    html += '<td class="light" id="h5"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>4</th>';
    html += '<td class="light" id="a4"></td>';
    html += '<td class="dark" id="b4"></td>';
    html += '<td class="light" id="c4"></td>';
    html += '<td class="dark" id="d4"></td>';
    html += '<td class="light" id="e4"></td>';
    html += '<td class="dark" id="f4"></td>';
    html += '<td class="light" id="g4"></td>';
    html += '<td class="dark" id="h4"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>3</th>';
    html += '<td class="dark" id="a3"></td>';
    html += '<td class="light" id="b3"></td>';
    html += '<td class="dark" id="c3"></td>';
    html += '<td class="light" id="d3"></td>';
    html += '<td class="dark" id="e3"></td>';
    html += '<td class="light" id="f3"></td>';
    html += '<td class="dark" id="g3"></td>';
    html += '<td class="light" id="h3"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>2</th>';
    html += '<td class="light" id="a2"><img src="/client/images/white_pawn.png" id="a2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="b2"><img src="/client/images/white_pawn.png" id="b2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="c2"><img src="/client/images/white_pawn.png" id="c2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="d2"><img src="/client/images/white_pawn.png" id="d2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="e2"><img src="/client/images/white_pawn.png" id="e2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="f2"><img src="/client/images/white_pawn.png" id="f2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="g2"><img src="/client/images/white_pawn.png" id="g2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="h2"><img src="/client/images/white_pawn.png" id="h2pawn" name="" draggable="true" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>1</th>';
    html += '<td class="dark" id="a1"><img src="/client/images/white_rook.png" id="a1rook" name="R" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="b1"><img src="/client/images/white_horse.png" id="b1knight" name="N" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="c1"><img src="/client/images/white_bishop.png" id="c1bishop" name="B" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="d1"><img src="/client/images/white_queen.png" id="d1queen" name="Q" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="e1"><img src="/client/images/white_king.png" id="e1king" name="K" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="f1"><img src="/client/images/white_bishop.png" id="f1bishop" name="B" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="dark" id="g1"><img src="/client/images/white_horse.png" id="g1knight" name="N" draggable="true" ondragstart="drag(event)"></td>';
    html += '<td class="light" id="h1"><img src="/client/images/white_rook.png" id="h1rook" name="R" draggable="true" ondragstart="drag(event)"></td>';
    html += '</tr>';
    html += '</tbody>';
    html += '</table>';

    return html;
}

function openForm() {
    document.getElementById("myForm").style.display = "block";
  }
  
  function closeForm(piece) {
    if(piece) {
        var move = (transferMove.move + "=" + piece)
        console.log(move);
        makeMove(move, true, transferMove.pieceID, transferMove.tileID);
    }
    document.getElementById("myForm").style.display = "none";
  }

  function logout() {
    $.ajax({
      url: chessURL + "/logout",
      type: "get",
      success: function(response){
          var data = JSON.parse(response);
          if(data.msg == "SUCCESS") {
            rerouteLogin();
          } else {
              alert(data.msg);
          }
      },
      error: function(err){
          console.log(err);
      }
  });
  return false;
  }

 function rerouteLogin() {
  window.location.assign('/login');
}