const prompt = require("prompt-sync")();

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
    team: null
}
var whiteTurn = true;

initBoard();
setupBoard();

var game = true;

while(game) {
    var turn = true;
    while(turn) {
        var move = prompt("Move: ");

        if(move == "STOP") {
            game = false;
            break;
        } else if(move == "PRINT") {
            printBoard();
            break;
        }

        notationReader(move);
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
            }
            if(k < 2) {
                board[j][k].piece.team = "WHITE";
            } else {
                board[j][k].piece.team = "BLACK";
            }
        }
    }
}

function notationReader(notation) {
    var pieceType = '';
    var tCol = null;
    var tRow = null;
    var valid = false;

    //Used to determine which piece is being moved in the case that two pieces of the same type are
    //able to move to the same tile.
    var special = null;

    switch(notation.length) {
        case 2:
            tCol = letterToNum(notation[0]);
            tRow = parseInt(notation[1]) - 1;
            valid = true;

            break;
        case 3:
            if(notation == "O-O") {
                //short castle
            } else {
                pieceType = notation[0];
                tCol = letterToNum(notation[1]);
                tRow = parseInt(notation[2]) - 1;
                valid = true;
            }

            break;
        case 4:
            if(notation[1] == 'x') {
                pieceType = notation[0];
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                valid = true;
            } else {
                pieceType = notation[0];
                special = notation[1];
                tCol = letterToNum(notation[2]);
                tRow = parseInt(notation[3]) - 1;
                valid = true;
            }
            
            break;
        case 5:
            if(notation[2] == 'x') {
                pieceType = notation[0];
                special = notation[1];
                tCol = letterToNum(notation[3]);
                tRow = parseInt(notation[4]) - 1;
                valid = true;
            } else if (notation == "O-O-O") {
                //Long castle
            }

            break;
    }

    if(valid) {
        try {
            var start = legalMove(pieceType, board[tCol][tRow], special);
            if(start) {
                var sCol = start.column;
                var sRow = start.row;

                board[tCol][tRow].piece = board[sCol][sRow].piece;
                board[sCol][sRow].piece = null;

                if(!board[tCol][tRow].piece.hasMoved) board[tCol][tRow].piece.hasMoved = true;
                console.log("Move Made");
                if(whiteTurn) whiteTurn = false;
                else whiteTurn = true;
            } else console.log("Invalid Move");
        } catch {
            console.log("Invalid Move");
        }
    } else {
        console.log("Invalid Move");
    }
}

function legalMove(pieceType, target, spec) {
    var tRow = target.row;
    var tCol = target.column;
    var playerTeam = "WHITE";
    if(!whiteTurn) playerTeam = "BLACK";
    var special = {
        notation: spec,
        cSpec: null,
        rSpec: null
    }
    if(spec) {
        if(letterToNum(spec)) special.cSpec = letterToNum(spec);
        else if (0 < parseInt(spec) && parseInt(spec) < 9) special.rSpec = parseInt(spec) - 1;
        else pieceType = "INVALID";
    }

    switch(pieceType) {
        case '':
            var maxMove = -1;
            //Makes sure the target is not blocked by a piece.
            if(!target.piece) {
                if(playerTeam == "BLACK") maxMove = 1;

                if(board[tCol][tRow + maxMove].piece) {
                    if(board[tCol][tRow + maxMove].piece.team == playerTeam && board[tCol][tRow + maxMove].piece.notation == pieceType) {
                        return board[tCol][tRow + maxMove];
                    }
                } else if(board[tCol][tRow + (2*maxMove)].piece && !board[tCol][tRow + (2*maxMove)].piece.hasMoved 
                    && board[tCol][tRow + (2*maxMove)].piece.team == playerTeam && board[tCol][tRow + (2*maxMove)].piece.notation == pieceType) {
                    return board[tCol][tRow + 2*maxMove];
                }

            } //else if(logic for en passant) {
            //}
            break;
        case 'K':
            //Makes sure the target isn't occupied by a friendly piece.
            if(!target.piece || target.piece.team != playerTeam) {
                //Makes sure the king isn't moving into check.
                if(!inCheck(target)) {
                    for(var i = -1; i < 2; i++) {
                        for(var j = -1; j < 2; j++) {
                            try {
                                //Checks if the piece on the tile is the player's king.
                                if(board[tCol + i][tRow + j].piece.notation == pieceType && board[tCol + i][tRow + j].piece.team == playerTeam) {
                                    return board[tCol + i][tRow + j];
                                }
                            } catch {}
                        }
                    }
                }
            }
            //logic for castling
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

function inCheck(target) {
    return false;
}

function vertCheck(target, pieceType, pieceTeam, special) {
    var tRow = target.row;
    var direction = 1;
    var search = true;
    if(special.notation) {
        if(special.cSpec) search = false;
        else if(special.rSpec < tRow) direction = -1;
    }

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
            return board[target.column][tRow];
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
    if(special.notation) {
        if(special.rSpec) search = false;
        else if(special.cSpec < tCol) direction = -1;
    }

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
            return board[tCol][target.row];
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

    while(search) {
        if((tRow + vertDir < 0 || tCol + horiDir < 0) && (vertDir == -1 && horiDir == -1)) {
            tRow = target.row;
            tCol = target.column;
            vertDir = 1;
            blocked = false;
        }
        if((tRow >= 7 || tCol + horiDir < 0) && (vertDir == 1 && horiDir == -1)) {
            tRow = target.row;
            tCol = target.column;
            horiDir = 1;
            blocked = false;
        }
        if((tRow >= 7 || tCol >= 7) && (vertDir == 1 && horiDir == 1)) {
            tRow = target.row;
            tCol = target.column;
            vertDir = -1;
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

    for(var i = -2; i < 3; i++) {
        if(i == 0) {
            //skip
        } else {
            try {
                console.log((tCol + i) + " " + (tRow + Math.abs(searchRows[i + 2])));
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