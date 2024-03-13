var sockets = function(app, io) {

    io.on('connection', (socket) => {
        console.log("user connected");
        socket.on('chat message', (msg) => {
          io.emit('chat message', msg);
        });

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
            if(io.sockets.adapter.rooms.get(mmcode).size == 2) {
              console.log("Game Start");
              socket.to(mmcode).emit('start-game', "nice");
            }
          }
        });

        socket.on('start-game', function(msg) {
          console.log(msg);
        });
      });
}

module.exports = sockets;