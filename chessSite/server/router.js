const path = require('path');
const escapeHtml = require('escape-html');

//Page listeners
var router = function(app) {
    app.get('/', function(req, res) {
        res.status(200).sendFile(path.join(__dirname + "/../client/login.html"));
    });

    app.get('/login', function(req, res) {
        res.status(200).sendFile(path.join(__dirname + "/../client/login.html"));
    });

    app.get('/board', function(req, res) {
        res.status(200).sendFile(path.join(__dirname + "/../client/board.html"));
    });

    //app.get('/board', function (req, res) {
        // this is only called when there is an authentication user due to isAuthenticated
      //  res.send('hello, ' + escapeHtml(req.session.username) + '!' +
        //  ' <a href="/logout">Logout</a>');
      //});
}

module.exports = router;