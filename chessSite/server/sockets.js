const { json } = require("express");

var sockets = function(app, io) {

    io.on('connection', (socket) => {
        console.log("user connected");

        socket.on('join-room', function(mmcode) {
          var users;
          try {
            users = io.sockets.adapter.rooms.get(mmcode).size
          }
          catch {
            users = 1;
          }
          if(users > 1) {
            console.log("Too many in room");
          } else {
            socket.join(mmcode);
            console.log("user has joined room " + mmcode);
          }
        });

        socket.on('send-move', function(move, roomCode, pieceID, tileID) {
          socket.broadcast.to(roomCode).emit('recieve-move', move, pieceID, tileID);
        });

        socket.on('send-username', function(username, roomCode) {
          socket.broadcast.to(roomCode).emit('recieve-username', username);
        });

        socket.on('get-team', function(roomCode) {
          var users;
          try {
            users = io.sockets.adapter.rooms.get(roomCode).size
          }
          catch {
            users = 1;
          }

          if(users < 2) {
            var team = null;
            if(Math.random()*2 < 1) team = "WHITE";
            else team = "BLACK";

            io.to(roomCode).emit('assign-team', team);
          } else {
            socket.broadcast.to(roomCode).emit('give-team');
          }
        });

        socket.on('share-team', function(team, roomCode) {
          var newTeam = null;
          if(team == "WHITE") newTeam = "BLACK";
          else newTeam = "WHITE";
          socket.broadcast.to(roomCode).emit('assign-team', newTeam);
        });

        socket.on('player-check', function(roomCode) {
          var users;
          try {
            users = io.sockets.adapter.rooms.get(roomCode).size
          }
          catch {
            users = 1;
          }
          if(users == 2) {
            io.to(roomCode).emit('give-username');
          }
        });
      });
}

module.exports = sockets;