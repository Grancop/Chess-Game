const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Grancop02',
    database: 'chessdb'
});

connection.connect(function(err) {
    if(err) throw err;

    console.log("Database is connected");
});

var services = function(app) {
    app.post('/register', function(req, res) {
        var data = {
            username: req.body.username,
            password: req.body.password
        };

        connection.query("SELECT * FROM player WHERE username = ?", [data.username], function(err, results, fields) {
            if (err) throw err;

            if (results.length > 0) {
                return res.status(200).send(JSON.stringify({msg: "Username already taken"}));
            } else {
                connection.query("INSERT INTO player SET ?", data, function(err){
                    req.session.loggedin = true;
                    req.session.username = data.username;
                    req.session.save(function (err) {
                        if (err) return next(err)
                    });
                    if(err) {
                        return res.status(200).send(JSON.stringify({msg: err}));
                    } else {
                        return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
                    }
                });
            }
        });
    });

    app.post('/auth', function(req, res) {
        
        var username = req.body.username;
        var password = req.body.password;
        
        connection.query('SELECT * FROM player WHERE username = ? AND password = ?', [username, password], function(err, results, fields) {
            if (err) throw err;

            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                req.session.save(function (err) {
                    if (err) return next(err)
                  });
                return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
            } else {
                return res.status(200).send(JSON.stringify({msg: "Incorrect username or password"}));
            }			
        });   
    });

    app.post('/start-game', function(req, res) {
        var username = req.body.username;
        var oppUser = req.body.opponent;
        var date = new Date().toLocaleDateString();
        var time = new Date().toLocaleTimeString();
        var mili = new Date().getMilliseconds();
        var gameID = (username + "VS" + oppUser + date + time + mili);
        req.session.gameid = gameID;
        req.session.code = req.body.code;
        req.session.team = req.body.team;
        req.session.save(function (err) {
            if (err) return next(err)
        });
        var playingWhite = null;
        if(req.session.team == "WHITE") playingWhite = true;
        else playingWhite = false;

        connection.query('INSERT INTO savedgames SET gameid = ?, oppUsername = ?, playingWhite = ?, player_username = (SELECT username FROM player WHERE username = ?)', 
        [gameID, oppUser, playingWhite, username], function(err){
            if(err) {
                return res.status(200).send(JSON.stringify({msg: err}));
            } else {
                return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
            }
        });
    });

    app.post('/move', function(req, res) {
        var notation = req.body.notation;
        
        connection.query("INSERT INTO moves SET notation = ?, savedgames_gameid = (SELECT gameid FROM savedgames WHERE gameid = ?)", 
        [notation, req.session.gameid], function(err){
            if(err) {
                return res.status(200).send(JSON.stringify({msg: err}));
            } else {
                return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
            }
        });
        
    });

    app.post('/end-game', function(req, res) {
        var gameID = req.session.gameid;
        var whiteWon = false;
        if(req.body.winner == "WHITE") whiteWon = 1;
        connection.query('UPDATE savedgames SET whiteWon = ? WHERE gameid = ?', [whiteWon, gameID], function(err) {
            if(err) {
                return res.status(200).send(JSON.stringify({msg: err}));
            } else {
                return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
            }
        });
    });

    app.get('/user', function(req, res) {
        if(req.session.username) {
            return res.status(200).send(JSON.stringify({msg: "SUCCESS", username: req.session.username}));
        } else {
            return res.status(200).send(JSON.stringify({msg: "FAIL"}));
        }
    });

    app.get('/logout', function(req, res) {
        try{
            req.session.destroy();
            return res.status(200).send(JSON.stringify({msg: "SUCCESS"}));
        } catch {
            return res.status(200).send(JSON.stringify({msg: "FAIL"}));
        }
    });
};

module.exports = services;