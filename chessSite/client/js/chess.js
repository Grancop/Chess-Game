const board = createArray(8, 8);
const column = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const tile = {
    notation: null,
    row: null,
    column: null,
    piece: null
}
const piece = {
    notation: '',
    hasMoved: false,
    isPinned: false,
    team: null
}
const kingTile = {
    white: null,
    black: null
}
const hitbox = {
    white: null,
    black: null
}
var activePieces = [];
var whiteTurn = true;
var myTurn = null;
var specUpdate = null;
var moveList = [];

initBoard();
setupBoard();

function gameStart(myTeam, user, oppUsername, mmcode) {
    if(myTeam == "WHITE") {
        myTurn = true;
        document.getElementById("menu-items").innerHTML = whiteBoard();
    }
    else {
        myTurn = false;
        document.getElementById("menu-items").innerHTML = blackBoard();
    }
    jsonString = {username: user, opponent: oppUsername, team: myTeam, code: mmcode}
    $.ajax({
        url: chessURL + "/start-game",
        type: "post",
        data: jsonString,
        success: function(response){
            var data = JSON.parse(response);
            if(data.msg == "SUCCESS") {
                alert("You are playing " + team + " against " + oppUsername);
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

function gameEnd(winner) {
    var jsonString = {winner: winner};
    $.ajax({
        url: chessURL + "/end-game",
        type: "post",
        data: jsonString,
        success: function(response){
            var data = JSON.parse(response);
            if(data.msg == "SUCCESS") {
                alert("Mate");
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

function makeMove(move, myMove, pieceID, tileID) {
    if(move && (myTurn || !myMove)) {
        var moveMade = notationReader(move);
        if(moveMade == true) {
            var jsonString = {notation: move};
            $.ajax({
                url: chessURL + '/move',
                type: 'post',
                data: jsonString,
                success: function(response){
                    var data = JSON.parse(response);
                    if(data.msg == "SUCCESS") {
                        if(myMove) {
                            myTurn = false;
                            socket.emit('send-move', move, mmcode, pieceID, tileID);
                            updateBoard(pieceID, tileID, specUpdate);
                        } else {
                            myTurn = true;
                            updateBoard(pieceID, tileID, specUpdate);
                        }
                    } else {
                        alert(data.msg);
                    } 
                },
                error: function(err){
                    console.log(err);
                }
            });
            return false;
        } else {
            alert("Invalid Move");
        }
    } else if(!myTurn && myMove) {
        alert("It is not your turn");
    }
}

function initBoard() {
    for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[i].length; j++) {
            board[j][i] = JSON.parse(JSON.stringify(tile));
            board[j][i].notation = (column[j] + (i + 1));
            board[j][i].row = i;
            board[j][i].column = j;
        }
    }
}

function printBoard() {
    for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[i].length; j++) {
            console.log(board[j][i].notation);
            if(board[j][i].piece) console.log("^Has a " + board[j][i].piece.notation + "^");
        }
    }
}

function setupBoard() {
    var targetRows = [0, 1, 6, 7]
    var backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

    for(var i = 0; i < 4; i++) {
        var k = targetRows[i];
        for(var j = 0; j < board[i].length; j++) {
            board[j][k].piece = JSON.parse(JSON.stringify(piece));
            if(k == 0 || k == 7) {
                board[j][k].piece.notation = backRow[j];
                if(backRow[j] == 'K' && k < 2) {
                    kingTile.white = board[j][k];
                } else if (backRow[j] == 'K') {
                    kingTile.black = board[j][k];
                }
            }
            if(k < 2) {
                board[j][k].piece.team = "WHITE";
            } else {
                board[j][k].piece.team = "BLACK";
            }
            activePieces.push(board[j][k].piece);
        }
    }
}

function notationReader(notation) {
    var pieceType = '';
    var tCol = null;
    var tRow = null;
    var valid = false;
    var castle = false;
    var promote = false;
    var special = {
        promotion: null,
        castle: null,
        cSpec: null,
        rSpec: null
    }
    if(whiteTurn) hitbox.white = null;
    else hitbox.black = null;

    switch(notation.length) {
        case 2:
            tCol = letterToNum(notation[0]);
            tRow = parseInt(notation[1]) - 1;
            if(((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) && board[tCol][tRow].piece) promote = true;
            else valid = true;

            break;
        case 3:
            if(notation == "O-O") {
                pieceType = 'K';
                special.castle = notation;
                castle = true;
            } else {
                pieceType = notation[0];
                tCol = letterToNum(notation[1]);
                tRow = parseInt(notation[2]) - 1;
                valid = true;
            }

            break;
        case 4:
            if(notation[2] == '=') {
                tCol = letterToNum(notation[0]);
                tRow = parseInt(notation[1]) - 1;
                special.promotion = notation[3];
                if((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) promote = true;
            }
            else if(notation[1] == 'x' && letterToNum(notation[0]) == null) {
                pieceType = notation[0];
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                if(board[tCol][tRow].piece) valid = true;

            } else if(!(letterToNum(notation[0]) == null) && notation[1] == 'x') {
                special.cSpec = letterToNum(notation[0]);
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                if(((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) && board[tCol][tRow].piece) promote = true;
                else if(board[tCol][tRow].piece || hitbox) valid = true;

            } else {
                pieceType = notation[0];
                    if(letterToNum(notation[1]) != null) special.cSpec = letterToNum(notation[1]);
                    else if (0 < parseInt(notation[1]) && parseInt(notation[1]) < 9) special.rSpec = parseInt(notation[1]) - 1;
                    else pieceType = "INVALID";
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                valid = true;
            }
            
            break;
        case 5:
            if(notation[2] == 'x') {
                pieceType = notation[0];
                    if(letterToNum(notation[1])) special.cSpec = letterToNum(notation[1]);
                    else if (0 < parseInt(notation[1]) && parseInt(notation[1]) < 9) special.rSpec = parseInt(notation[1]) - 1;
                    else pieceType = "INVALID";
                tCol = letterToNum(notation[3]);
                tRow = parseInt(notation[4]) - 1;
                if(board[tCol][tRow].piece) valid = true;

            } else if (notation == "O-O-O") {
                pieceType = 'K';
                special.castle = notation;
                castle = true;

            } else {
                pieceType = notation[0];
                special.cSpec = letterToNum(notation[1]);
                special.rSpec = parseInt(notation[2]) - 1;
                tCol = letterToNum(notation[3]);
                tRow = parseInt(notation[4]) - 1;
                valid = true;
            } 

            break;
        case 6:
            if(notation[3] == 'x') {
                pieceType = notation[0];
                special.cSpec = letterToNum(notation[1]);
                special.rSpec = parseInt(notation[2]) - 1;
                tCol = letterToNum(notation[4]);
                tRow = parseInt(notation[5]) - 1;
                if(board[tCol][tRow].piece) valid = true;

            } else if(notation[1] == 'x' && notation[4] == '=') {
                special.cSpec = letterToNum(notation[0]);
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                special.promotion = notation[5];
                if(((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) && board[tCol][tRow].piece) promote = true;
                else if(board[tCol][tRow].piece) valid = true;
            }
    }

    if(valid) {
        //try {
            var start = legalMove(pieceType, board[tCol][tRow], special);
            if(start) {
                var sCol = start.column;
                var sRow = start.row;
                var tempTar = null;
                var tempStar = null;

                tempStar = board[sCol][sRow].piece;
                if(tempTar = board[tCol][tRow].piece);

                board[tCol][tRow].piece = board[sCol][sRow].piece;
                board[sCol][sRow].piece = null;
                if(board[tCol][tRow].piece.notation == 'K') {
                    if(whiteTurn) kingTile.white = board[tCol][tRow];
                    else kingTile.black = board[tCol][tRow];
                }
                if((whiteTurn && inCheck(kingTile.white, "WHITE")) || (!whiteTurn && inCheck(kingTile.black, "BLACK"))) {
                    board[tCol][tRow].piece = tempTar;
                    board[sCol][sRow].piece = tempStar;
                    console.log("King is in check");
                    if(board[tCol][tRow].piece.notation == 'K') {
                        if(whiteTurn) kingTile.white = board[tCol][tRow];
                        else kingTile.black = board[tCol][tRow];
                    }
                } else if((whiteTurn && mateCheck(kingTile.black)) || (!whiteTurn && mateCheck(kingTile.white))) {
                    var whiteWon = "BLACK";
                    if(whiteTurn) whiteWon = "WHITE";
                    gameEnd(whiteWon);
                    return true;
                } else {
                    if(!board[tCol][tRow].piece.hasMoved) board[tCol][tRow].piece.hasMoved = true;
                    console.log("Move Made");
                    if(whiteTurn) whiteTurn = false;
                    else whiteTurn = true;
                    return true;
                }
            } else console.log("Invalid Move");
        //} catch {
            //console.log("Invalid Move");
        //}
    } else if(castle) {
        var playerKT = kingTile.white;
        if(!whiteTurn) playerKT = kingTile.black;
        return legalMove(pieceType, playerKT, special);
    } else if(promote) {
        return legalMove(pieceType, board[tCol][tRow], special);
    } else {
        console.log("Invalid Move");
    }
    return false;
}

function legalMove(pieceType, target, special) {
    var tRow = target.row;
    var tCol = target.column;
    var playerTeam = "WHITE";
    if(!whiteTurn) playerTeam = "BLACK";
    specUpdate = null;

    switch(pieceType) {
        case '':
            var maxMove = -1;
            if(playerTeam == "BLACK") maxMove = 1;
            //Makes sure the target is not blocked by a piece.
            if(!target.piece && special.cSpec == null) {

                if(board[tCol][tRow + maxMove].piece) {
                    if(board[tCol][tRow + maxMove].piece.team == playerTeam && board[tCol][tRow + maxMove].piece.notation == pieceType) {
                        if((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) promote(board[tCol][tRow + maxMove], target, special);
                        else return board[tCol][tRow + maxMove];
                    }
                } else if(board[tCol][tRow + (2*maxMove)].piece && !board[tCol][tRow + (2*maxMove)].piece.hasMoved 
                    && board[tCol][tRow + (2*maxMove)].piece.team == playerTeam && board[tCol][tRow + (2*maxMove)].piece.notation == pieceType) {
                    if(whiteTurn) hitbox.white = board[tCol][tRow + maxMove];
                    else hitbox.black = board[tCol][tRow + maxMove];
                    return board[tCol][tRow + 2*maxMove];
                }

            } else if(!(special.cSpec == null) && special.cSpec != tCol) {
                if((target.piece && target.piece.team != playerTeam) || ((whiteTurn && target == hitbox.black) || (!whiteTurn && target == hitbox.white))) {
                    if(board[special.cSpec][tRow + maxMove].piece && board[special.cSpec][tRow + maxMove].piece.notation == '' &&
                    board[special.cSpec][tRow + maxMove].piece.team == playerTeam) {
                        if((whiteTurn && target == hitbox.black) || (!whiteTurn && target == hitbox.white)) {
                            board[tCol][tRow + maxMove].piece = null;
                            specUpdate = "ENPAS";
                        }
                        if((whiteTurn && tRow == 7) || (!whiteTurn && tRow == 0)) return promote(board[special.cSpec][tRow + maxMove], target, special);
                        else return board[special.cSpec][tRow + maxMove];
                    }
                }
            }
            break;
        case 'K':
            //Makes sure the target isn't occupied by a friendly piece.
            if(!target.piece || target.piece.team != playerTeam) {
                //Makes sure the king isn't moving into check.
                if(!inCheck(target, playerTeam)) {
                    return kingCheck(target, playerTeam)
                }
            } else if(special.castle) {
                if(!inCheck(target, playerTeam)) {
                    return castle(target, special, playerTeam);
                }
            }
            break;
        case 'Q':
            if(!target.piece || target.piece.team != playerTeam) {
                var retTile = null;
                if(retTile = vertCheck(target, pieceType, playerTeam, special)) return retTile;
                else if(retTile = horiCheck(target, pieceType, playerTeam, special)) return retTile;
                else if(retTile = diagCheck(target, pieceType, playerTeam, special)) return retTile;
            }
            break;
        case 'R':
            if(!target.piece || target.piece.team != playerTeam) {
                var retTile = null;
                if(retTile = vertCheck(target, pieceType, playerTeam, special)) return retTile;
                else if(retTile = horiCheck(target, pieceType, playerTeam, special)) return retTile;
            }
            break;
        case 'B':
            if(!target.piece || target.piece.team != playerTeam) {
                var retTile = null;
                if(retTile = diagCheck(target, pieceType, playerTeam, special)) return retTile;
            }
            break;
        case 'N':
            if(!target.piece || target.piece.team != playerTeam) {
                var retTile = null;
                if(retTile = knightCheck(target, playerTeam, special)) return retTile;
            }
            break;
    }
    return null;
}

function inCheck(target, playerTeam) {
    var checking = null;
    var special = {
        cSpec: null,
        rSpec: null
    };
    var enemyTeam = "WHITE";
    var pawnDir = -1;
    if(playerTeam == "WHITE") {
        enemyTeam = "BLACK";
        pawnDir = 1;
    }

    //Check if targeted by rook, queen, or bishop.
    if(!(checking = vertCheck(target, 'R', enemyTeam, special)) && !(checking = vertCheck(target, 'Q', enemyTeam, special)) &&
    !(checking = horiCheck(target, 'R', enemyTeam, special)) && !(checking = horiCheck(target, 'Q', enemyTeam, special)) &&
    !(checking = diagCheck(target, 'B', enemyTeam, special)) && !(checking = diagCheck(target, 'Q', enemyTeam, special)) &&
    !(checking = knightCheck(target, enemyTeam, special)) && !(checking = kingCheck(target, enemyTeam))) {
        try {
            if(board[target.column - 1][target.row + pawnDir].piece.notation == '' && board[target.column - 1][target.row + pawnDir].piece.team == enemyTeam) return board[target.column - 1][target.row + pawnDir];
        } catch {}
        try {
            if(board[target.column + 1][target.row + pawnDir].piece.notation == '' && board[target.column + 1][target.row + pawnDir].piece.team == enemyTeam) return board[target.column + 1][target.row + pawnDir];
        } catch {}
        return false;
    }
    return checking;
}

function vertCheck(target, pieceType, pieceTeam, special) {
    var tRow = target.row;
    var direction = 1;
    var search = true;
    if(!(special.cSpec == null) && special.rSpec == null) search = false;
    else if(special.rSpec != null && special.rSpec < tRow) direction = -1;

    while(search) {
        if(tRow >= 7) {
            tRow = target.row;
            direction = -1;
        }
        if(tRow + direction < 0) {
            search = false;
            break;
        }
        tRow += direction;

        if(board[target.column][tRow].piece && board[target.column][tRow].piece.notation == pieceType && board[target.column][tRow].piece.team == pieceTeam) {
            if(special.rSpec != null) {
                if(tRow == special.rSpec) return board[target.column][tRow];
                else return null;
            } else return board[target.column][tRow];
        } else if(board[target.column][tRow].piece && direction == 1) {
            tRow = target.row;
            direction = -1;
        } else if(board[target.column][tRow].piece) {
            search = false;
        }
    }
    return null;
}

function horiCheck(target, pieceType, pieceTeam, special) {
    var tCol = target.column;
    var direction = 1;
    var search = true;
    if(!(special.rSpec == null) && special.cSpec == null) search = false;
    else if(special.cSpec != null && special.cSpec < tCol) direction = -1;

    while(search) {
        if(tCol > 6) {
            tCol = target.column;
            direction = -1;
        }
        if(tCol + direction < 0) {
            search = false;
            break;
        }
        tCol += direction;

        if(board[tCol][target.row].piece && board[tCol][target.row].piece.notation == pieceType && board[tCol][target.row].piece.team == pieceTeam) {
            if(special.cSpec != null) {
                if(tCol == special.cSpec) return board[tCol][target.row];
                else return null;
            } else return board[tCol][target.row];
        } else if(board[tCol][target.row].piece && direction == 1) {
            tCol = target.column;
            direction = -1;
        } else if(board[tCol][target.row].piece) {
            search = false;
        }
    }
    return null;
}

function diagCheck(target, pieceType, pieceTeam, special) {
    var tRow = target.row;
    var tCol = target.column;
    var vertDir = -1;
    var horiDir = -1;
    var search = true;
    var blocked = false;

    var startPhase = 1;


    if((special.cSpec != null && special.rSpec != null) && (special.cSpec > tCol && special.rSpec < tRow)) startPhase = 4;
    else if(special.cSpec != null && special.cSpec > tCol) startPhase = 3;
    else if(special.rSpec != null && special.rSpec > tRow) startPhase = 2;

    while(search) {
        if(((tRow + vertDir < 0 || tCol + horiDir < 0) && (vertDir == -1 && horiDir == -1)) || startPhase == 2) {
            tRow = target.row;
            tCol = target.column;
            vertDir = 1;
            horiDir = -1;
            startPhase = 0;
            blocked = false;
        }
        if(((tRow + vertDir > 7 || tCol + horiDir < 0) && (vertDir == 1 && horiDir == -1)) || startPhase == 3) {
            tRow = target.row;
            tCol = target.column;
            vertDir = 1;
            horiDir = 1;
            startPhase = 0;
            blocked = false;
        }
        if(((tRow >= 7 || tCol >= 7) && (vertDir == 1 && horiDir == 1)) || startPhase == 4) {
            tRow = target.row;
            tCol = target.column;
            vertDir = -1;
            horiDir = 1;
            startPhase = 0;
            blocked = false;
        }
        if((tRow + vertDir < 0 || tCol >= 7) && (vertDir == -1 && horiDir == 1)) {
            search = false;
            break;
        }
        tRow += vertDir;
        tCol += horiDir;

        if(board[tCol][tRow].piece && board[tCol][tRow].piece.notation == pieceType && board[tCol][tRow].piece.team == pieceTeam && !blocked) {
            return board[tCol][tRow];
        } else if(board[tCol][tRow].piece) {
            blocked = true;
        }
    }
    return null;
}

function knightCheck(target, pieceTeam, special) {
    tRow = target.row;
    tCol = target.column;
    searchRows = [-1, -2, 0, -2, -1];

    if(special.cSpec != null && special.rSpec != null) {
        if(board[special.cSpec][special.rSpec].piece && 
        board[special.cSpec][special.rSpec].piece.notation == 'N' && 
        board[special.cSpec][special.rSpec].piece.team == pieceTeam) {
            if((Math.abs(special.cSpec - tCol) == 1 && Math.abs(special.rSpec - tRow) == 2) || (Math.abs(special.cSpec - tCol) == 2 && Math.abs(special.rSpec - tRow) == 1)) return board[special.cSpec][special.rSpec];
        }
    } else if(special.cSpec != null) {
        var i = 0;
        if(Math.abs(special.cSpec - tCol) == 1) i = -2;
        else if(Math.abs(special.cSpec - tCol) == 2) i = -1;
        
        if(i != 0) {
            try {
                if(board[special.cSpec][tRow + i].piece && 
                board[special.cSpec][tRow + i].piece.notation == 'N' && 
                board[special.cSpec][tRow + i].piece.team == pieceTeam) {
                    return board[special.cSpec][tRow + i];
                }
            } catch {}
            try {
                i = Math.abs(i);
                if(board[special.cSpec][tRow + i].piece && 
                board[special.cSpec][tRow + i].piece.notation == 'N' && 
                board[special.cSpec][tRow + i].piece.team == pieceTeam) {
                    return board[special.cSpec][tRow + i];
                }
            } catch {}
        }
    } else if(special.rSpec != null) {
        var i = 0;
        if(Math.abs(special.rSpec - tRow) == 1) i = -2;
        else if(Math.abs(special.rSpec - tRow) == 2) i = -1;
        
        if(i != 0) {
            try {
                if(board[tCol + i][special.rSpec].piece && 
                board[tCol + i][special.rSpec].piece.notation == 'N' && 
                board[tCol + i][special.rSpec].piece.team == pieceTeam) {
                    return board[tCol + i][special.rSpec];
                }
            } catch {}
            try {
                i = Math.abs(i);
                if(board[tCol + i][special.rSpec].piece && 
                board[tCol + i][special.rSpec].piece.notation == 'N' && 
                board[tCol + i][special.rSpec].piece.team == pieceTeam) {
                    return board[tCol + i][special.rSpec];
                }
            } catch {}
        }
    } else {
        for(var i = -2; i < 3; i++) {
            if(i == 0) {
                //skip
            } else {
                try {
                    if(board[tCol + i][tRow + Math.abs(searchRows[i + 2])].piece && 
                    board[tCol + i][tRow + Math.abs(searchRows[i + 2])].piece.notation == 'N' && 
                    board[tCol + i][tRow + Math.abs(searchRows[i + 2])].piece.team == pieceTeam) {
                        return board[tCol + i][tRow + Math.abs(searchRows[i + 2])];
                    }
                } catch {}
                try {
                    if(board[tCol + i][tRow + searchRows[i + 2]].piece && 
                    board[tCol + i][tRow + searchRows[i + 2]].piece.notation == 'N' && 
                    board[tCol + i][tRow + searchRows[i + 2]].piece.team == pieceTeam) {
                        return board[tCol + i][tRow + searchRows[i + 2]];
                    }
                } catch {}
            }
        }
    }
}

function kingCheck(target, playerTeam) {
    tRow = target.row;
    tCol = target.column;

    for(var i = -1; i < 2; i++) {
        for(var j = -1; j < 2; j++) {
            try {
                //Checks if the piece on the tile is the player's king.
                if(board[tCol + i][tRow + j].piece.notation == 'K' && board[tCol + i][tRow + j].piece.team == playerTeam) {
                    return board[tCol + i][tRow + j];
                }
            } catch {}
        }
    }
    return null;
}

function promote(start, target, special) {
    var pieceType = null;
    var badInput = true;
    if(special.promotion) {
        if(special.promotion == 'B' || special.promotion == 'N' || special.promotion == 'R' || special.promotion == 'Q') pieceType = special.promotion;
    } else {
        pieceType = prompt("Promote to (B, N, R, Q): ");
        while(badInput) {

            if(pieceType == 'B' || pieceType == 'N' || pieceType == 'R' || pieceType == 'Q') badInput = false;
            else pieceType = prompt("Enter B, N, R, or Q: ");
        }
    }

    if(pieceType) {
        board[target.column][target.row].piece = JSON.parse(JSON.stringify(piece));
        board[target.column][target.row].piece.notation = pieceType;
        if(whiteTurn) board[target.column][target.row].piece.team = "WHITE";
        else board[target.column][target.row].piece.team = "BLACK";
        board[target.column][target.row].piece.hasMoved = true;

        board[start.column][start.row].piece = null;

        console.log("Pawn Promoted");
        if(whiteTurn) {
            specUpdate = pieceType + "w";
            whiteTurn = false;
        }
        else {
            specUpdate = pieceType + "b";
            whiteTurn = true;
        }
        return true;
    } else {
        console.log("Invalid Move");
        return false;
    }
}

function castle(target, special, playerTeam) {
    var tCol = target.column;
    var tRow = target.row;
    var search = true;
    var direction = 1;
    if(special.castle == "O-O-O") direction = -1;
    var move = direction;

    while(search) {
        if(tCol + move < 0 || tCol + move > 7) {
            console.log("Invalid Move");
            search = false;
        }
        else if(board[tCol + move][tRow].piece) {
            if(board[tCol + move][tRow].piece.notation == 'R' &&
            board[tCol + move][tRow].piece.team == playerTeam &&
            board[tCol + move][tRow].piece.hasMoved == false) {
                board[tCol + 2*direction][tRow].piece = board[tCol][tRow].piece;
                board[tCol + 2*direction][tRow].piece.hasMoved = true;
                board[tCol][tRow].piece = null;
                board[tCol + direction][tRow].piece = board[tCol + move][tRow].piece;
                board[tCol + direction][tRow].piece.hasMoved = true;
                board[tCol + move][tRow].piece = null;

                if(whiteTurn) {
                    kingTile.white = board[tCol + 2*direction][tRow];
                    whiteTurn = false;
                } else {
                    kingTile.black = board[tCol + 2*direction][tRow];
                    whiteTurn = true;
                }

                console.log("Move Made");
                search = false;
                specUpdate = special.castle;
                return true;
            } else {
                console.log("Invalid Move");
                search = false;
                return false;
            }
        } else {
            if(Math.abs(move) < 3 && inCheck(board[tCol + move][tRow], playerTeam)) {
                console.log("Invalid Move");
                search = false;
                return false;
            } else {
                move += direction;
            }
        }
    }
}

function mateCheck(tile) {
    var possibleCapture = [];
    var target = null;
    if(target = inCheck(tile, tile.piece.team)) {
        var tRow = target.row;
        var tCol = target.column;
        var checkingPiece = target.piece;
        var enemyTeam = "WHITE";
        var pawnDir = -1;
        if(checkingPiece.team == "WHITE") {
            enemyTeam = "BLACK";
            pawnDir = 1;
        }
        var special = {
            promotion: null,
            castle: null,
            cSpec: null,
            rSpec: null
        }
        for(var i = -1; i < 2; i++) {
            for(var j = -1; j < 2; j++) {
                try {
                    if(!inCheck(board[tCol + i][tRow + j], tile.piece.team) && (!board[tCol + i][tRow + j].piece || board[tCol + i][tRow + j].piece.team == enemyTeam)) {
                    return false;
                    }
                } catch {}
            }
        }
        possibleCapture.push(vertCheck(target, 'R', enemyTeam, special));
        possibleCapture.push(vertCheck(target, 'Q', enemyTeam, special));
        possibleCapture.push(horiCheck(target, 'R', enemyTeam, special));
        possibleCapture.push(horiCheck(target, 'Q', enemyTeam, special));
        possibleCapture.push(diagCheck(target, 'B', enemyTeam, special));
        possibleCapture.push(diagCheck(target, 'Q', enemyTeam, special));
        possibleCapture.push(knightCheck(target, enemyTeam, special));
        possibleCapture.push(kingCheck(target, enemyTeam));
        try {
            if(board[target.column - 1][target.row + pawnDir].piece.notation == '' && board[target.column - 1][target.row + pawnDir].piece.team == enemyTeam) possibleCapture.push(board[target.column - 1][target.row + pawnDir]);
        } catch {}
        try {
            if(board[target.column + 1][target.row + pawnDir].piece.notation == '' && board[target.column + 1][target.row + pawnDir].piece.team == enemyTeam) possibleCapture.push(board[target.column + 1][target.row + pawnDir]);
        } catch {}

        for(var i = 0; i < possibleCapture.length; i++) {
            var capTar = possibleCapture.pop();
            console.log(capTar);
            if(capTar){
                if(moveSim(target, capTar)) return false;
            }
        }
        return true;
    }
}

function moveSim(target, capTar) {
    var sRow = capTar.row;
    var sCol = capTar.column;
    var tRow = target.row;
    var tCol = target.column;
    var tempTar = null;
    var tempStar = null;

    tempStar = board[sCol][sRow].piece;
    if(tempTar = board[tCol][tRow].piece);

    board[tCol][tRow].piece = board[sCol][sRow].piece;
    board[sCol][sRow].piece = null;
    if(board[tCol][tRow].piece.notation == 'K') {
        if(board[tCol][tRow].piece.team == "WHITE") kingTile.white = board[tCol][tRow];
        else kingTile.black = board[tCol][tRow];
    }
    if((!whiteTurn && inCheck(kingTile.white, "WHITE")) || (whiteTurn && inCheck(kingTile.black, "BLACK"))) {
        board[tCol][tRow].piece = tempTar;
        board[sCol][sRow].piece = tempStar;
        if(board[tCol][tRow].piece.notation == 'K') {
            if(board[tCol][tRow].piece.team == "WHITE") kingTile.white = board[tCol][tRow];
            else kingTile.black = board[tCol][tRow];
        }
        return false;
    }
    board[tCol][tRow].piece = tempTar;
    board[sCol][sRow].piece = tempStar;
    if(board[tCol][tRow].piece.notation == 'K') {
        if(board[tCol][tRow].piece.team == "WHITE") kingTile.white = board[tCol][tRow];
        else kingTile.black = board[tCol][tRow];
    }
    return true;
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function letterToNum(letter) {
    for(var i = 0; i < column.length; i++) {
        if(letter == column[i]) return i;
    }
    return null;
}