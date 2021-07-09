var express = require('express');
var session = require('express-session');
var app = express();
var bodyparser = require('body-parser');
var urlencoded = bodyparser.urlencoded({ extended: false });
var mysql = require('mysql');
var alert = require('alert');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "ChatApp"
});

con.connect(function (err) {

});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + 'index.html');
});

app.get('/login.html', function (req, res) {
    res.sendFile(__dirname + '/' + '/login.html');
})

app.post('/login.html', function (req, res) {
    res.sendFile(__dirname + '/' + '/login.html');
})

app.post('/process_get', urlencoded, function (req, res) {
    var uname = req.body.username;
    var pwd = req.body.password;

    if (uname && pwd) {
        con.query("SELECT * FROM Users WHERE username = ? AND password = ?", [uname, pwd], function (err, result, field) {
            if (result.length > 0) {
                req.session.loggedin = true;
                req.session.user_id = result[0].id;
                req.session.username = uname;
                res.redirect('/screen');
            }

            else {
                alert("Authentication Failed!");
                res.redirect('/login.html');
            }
        });
    }
});

app.post('/signup.html', function (req, res) {
    res.sendFile(__dirname + '/' + '/signup.html');
})

app.post('/process_signup', urlencoded, function (req, res) {
    var uname = req.body.username;
    var pwd = req.body.password;
    var email = req.body.email;

    if (uname && pwd) {
        con.query("INSERT INTO Users(username,password,email) VALUES (?,?,?)", [uname, pwd, email], function (err, result) {
            if (err) throw err;

            else {
                req.session.loggedin = true;
                req.session.username = uname;
                res.redirect('/screen');
            }

        });
    }

});

app.get('/screen', function (req, res) {
    if (req.session.loggedin) {

        var str = "Successful Authentication. Welcome " + req.session.username + "<html><head></head><body><table><th>Users</th>";
        var uname = req.session.username;


            con.query("SELECT * FROM Users WHERE username != ?", [uname], function (err, result, field) {
            if (result.length > 0)
                for (var i = 0; i < result.length; i++) {
                    str += "<tr><td><form action='chat' method='post'><button name='user' value="+result[i].id +"type = 'submit' > " + result[i].username + "</button ></form ></td ></tr > ";
                    }
                
                str += "</table></body></html>";
                res.send(str);
                res.end();
        });
    }

    else {
        res.redirect('/login.html');
    }
})

app.post('/chat', urlencoded, function (req, res) {
    req.session.recv_id = req.body.user;
    res.sendFile(__dirname+"/"+"chat.html");
});  

io.on("connection", function (socket) {
    console.log("entered");
    socket.on("sent", function (message) {
        console.log(message);
        con.query("INSERT INTO Messages(sender_id,receiver_id,message) VALUES (?,?,?)", [session.user_id, session.recv_id, message], function (err, result) {
            if (err) throw err;

            else {
                console.log("Message Inserted");
            }
        });
    });
});

var server = http.listen(8081);