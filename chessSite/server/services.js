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

    app.get('/user', function(req, res) {
        if(req.session.username) {
            return res.status(200).send(JSON.stringify({msg: "SUCCESS", username: req.session.username}));
        } else {
            return res.status(200).send(JSON.stringify({msg: "FAIL"}));
        }
    });
};

module.exports = services;