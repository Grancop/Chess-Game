const express = require('express');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const bodyParser = require('body-parser');

app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use("/client", express.static(path.resolve(__dirname + "/../client/")));

//Define the server
var port = process.env.PORT || process.env.NODE_PORT || 5000;

//Page listeners
var router = require('./router.js');
router(app);

//Service listener
var services = require('./services.js');
services(app);

//Socket listener
var sockets = require('./sockets.js');
sockets(app, io);

//listen
server.listen(port, function(err) {
    if(err) throw err;

    console.log("Listening on port " + port);
});