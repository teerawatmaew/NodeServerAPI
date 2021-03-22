require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var jwt = require("jsonwebtoken");
var fs = require('fs');

var app = express();

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'nodelogin'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(process.env.PWD + '/img'));
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder

let refreshTokens = [];

app.post('/token', (request, response) => {
    const refreshToken = request.body.token;
    if (refreshToken == null) return response.sendStatus(401);
    if (!refreshTokens.includes(refreshToken)) return response.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return response.sendStatus(403);
        const accessToken = generateAccessToken({ name: user.name });
        response.json({ accessToken: accessToken });
    })
})

app.get('/logout', function (request, response) {
    response.sendStatus(200);
});

//<============================>
//<====== token function ======>
//<============================>

function authenticateToken(request, response, next) {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return response.senStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return response.sendStatus(403);
        request.user = user;
        next();
    });
}

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '300s' });
}

//<======= user api =======>
var user = require('./api/v1/user');

app.post('/api/v1/login', user.login);
app.get('/api/v1/signup', user.signup);
app.post('/api/v1/forgot', user.forgot);
app.get('/api/v1/profile', user.profile);
app.put('/api/v1/profile', user.editprofile);
//app.get('/api/v1/profile', authenticateToken, user.profile);
//app.put('/api/v1/profile', authenticateToken, user.editprofile);
app.get('/api/v1/user/:id', user.read);
//app.get('/api/v1/user/:keyword', user.search);
app.get('/api/v1/user', user.readall);
app.post('/api/v1/user', user.create);
app.put('/api/v1//user/:id', user.update);
app.delete('/api/v1//user/:id', user.delete);


//<========================>
//<====== course api ======>
//<========================>

app.get('/course', function (request, response) {
    connection.query('SELECT * FROM courses', (err, results) => {
        if (err) {
            throw err;
            response.status(404).send("Can not found users");
        }
        else {
            response.status(200).json({ results });
        }
    });
});

app.get('/course/:id', function (request, response) {
    connection.query('SELECT * FROM courses WHERE course_id = ' + request.params.id, function (err, result) {
        if (err) {
            throw err;
            response.status(404).send("Can not found user");
        } else {
            response.status(200).json(result);
        }
    });
});

app.post('/course', function (request, response) {
    var coursename = request.body.coursename;
    var category = request.body.category;
    var credit = request.body.credit;
    connection.query('SELECT * FROM courses WHERE course_name = ?', [coursename], function (error, results, fields) {
        if (results.length > 0) {
            response.status(404).send("Course is already exists");
        } else {
            connection.query('INSERT INTO courses(course_name, category, credit) VALUES(?,?,?)', [coursename, category, credit], (err, result) => {
                if (err) {
                    throw err;
                    response.send("Can not create new course");
                } else {
                    response.status(200).send("Create completed");
                }
            });
        }
    });
})

app.put('/course/(:id)', function (request, response) {
    var courseid = request.params.id;
    var coursename = request.body.editcoursename;
    var category = request.body.editcategory;
    var credit = request.body.editcredit;
    connection.query('SELECT * FROM courses WHERE course_name = ?', [coursename], function (error, results, fields) {
        if (results.length > 1) {
            response.status(404).send("Course is already exists");
        } else {
            connection.query('UPDATE courses SET course_name=?, category=?, credit=? WHERE course_id=?', [coursename, category, credit, courseid], (err, result) => {
                if (err) {
                    throw err;
                    response.send("Can not update this course");
                } else {
                    response.status(200).send("Update completed");
                }
            });
        }
    });
})

app.delete('/course/(:id)', function (request, response) {
    var courseid = request.params.id;
    connection.query('DELETE FROM courses WHERE course_id = ?', [courseid], function (err, result) {
        if (err) {
            throw err;
            response.send("Can not delete this course");
        } else {
            response.status(200).send("Delete completed");
        }
    });
})

//<================>
// app is on port...
//<================>
app.listen(4000);