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

app.use((req, res, next) => {
    /*
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
    */
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next()
})

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
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}

//<======= user api =======>
var user = require('./api/v1/user');
const { connect } = require("tls");

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
    connection.query('SELECT * FROM course', (err, results) => {
        if (err) {
            throw err;
            response.status(404).send("Can not found users");
        }
        else {
            response.status(200).send({ courses: results });
        }
    });
});

app.get('/course/:id', function (request, response) {
    connection.query('SELECT * FROM course WHERE id = ' + request.params.id, function (err, results) {
        if (err) {
            throw err;
            response.status(404).send("Can not found user");
        } else {
            response.status(200).send({ course: results });
        }
    });
});

app.post('/course', function (request, response) {
    var id = request.body.id;
    var name = request.body.name;
    var limit = request.body.number_limit;
    var registerstart = request.body.register_startdate;
    var registerend = request.body.register_enddate;
    var start = request.body.startdate;
    var end = request.body.enddate;
    var createby = request.body.create_by;
    var createdate = request.body.create_date;
    var owner = request.body.user_owner;
    var location = request.body.location;
    var type = request.body.type;
    var contact = request.body.contact;

    connection.query('SELECT * FROM course WHERE id = ?', [id], function (error, results, fields) {
        if (results.length > 0) {
            response.status(404).send("Course is already exists");
        } else {
            connection.query('INSERT INTO course(id, name, number_limit, register_startdate, register_enddate, startdate, enddate, create_by, create_date, user_owner, location, type, contact, active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1)', [id, name, limit, registerstart, registerend, start, end, createby, createdate, owner, location, type, contact], (err, result) => {
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

app.put('/course', function (request, response) {
    var id = request.body.id;
    var name = request.body.name;
    var limit = request.body.number_limit;
    var registerstart = request.body.register_startdate;
    var registerend = request.body.register_enddate;
    var start = request.body.startdate;
    var end = request.body.enddate;
    var createdate = request.body.create_date;
    var createby = request.body.create_by;
    var updatedate = request.body.update_date;
    var updateby = request.body.update_by;
    var owner = request.body.user_owner;
    var location = request.body.location;
    var type = request.body.type;
    var contact = request.body.contact;
    var active = request.body.active;
    var logo = request.body.logo_img;
    connection.query('SELECT * FROM course WHERE id = ?', [id], function (error, results, fields) {
        if (results.length > 0) {
            connection.query('UPDATE course SET name=?, number_limit=?, register_startdate=?, register_enddate=?, startdate=?, enddate=?, create_by=?, create_date=?, update_by=?, update_date=?, user_owner=?, location=?, type=?, contact=?, active=?, logo_img=? WHERE id=?',
                [name, limit, registerstart, registerend, start, end, createby, createdate, updateby, updatedate, owner, location, type, contact, active, logo, id], (err, result) => {
                    if (err) {
                        throw err;
                        response.status(404).send("Can not update this course");
                    } else {
                        response.status(200).send({
                            course: {
                                id: id,
                                name: name,
                                number_limit: limit,
                                register_startdate: registerstart,
                                register_enddate: registerend,
                                startdate: start,
                                enddate: end,
                                create_by: createby,
                                create_date: createdate,
                                update_by: updateby,
                                update_date: updatedate,
                                active: active,
                                user_owner: owner,
                                location: location,
                                type: type,
                                contact: contact,
                                logo_img: logo
                            }
                        });
                    }
                });
        } else {
            connection.query('INSERT INTO course(id, name, number_limit, register_startdate, register_enddate, startdate, enddate, create_by, create_date, user_owner, location, type, contact, active, logo_img) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)',
                [id, name, limit, registerstart, registerend, start, end, createby, createdate, owner, location, type, contact, logo], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send({ error: err });
                } else {
                    response.status(200).send({
                        course: {
                            id: id,
                            name: name,
                            number_limit: limit,
                            register_startdate: registerstart,
                            register_enddate: registerend,
                            startdate: start,
                            enddate: end,
                            create_by: createby,
                            create_date: createdate,
                            update_by: updateby,
                            update_date: updatedate,
                            active: active,
                            user_owner: owner,
                            location: location,
                            type: type,
                            contact: contact,
                            logo_img: logo
                        }
                    });
                }
            });
        }
    });
})

app.delete('/course/(:id)', function (request, response) {
    var courseid = request.params.id;
    connection.query('DELETE FROM courses WHERE id = ?', [courseid], function (err, result) {
        if (err) {
            throw err;
            response.send("Can not delete this course");
        } else {
            response.status(200).send("Delete completed");
        }
    });
})

app.get('/search/course/(:keyword)', function (request, response) {
    //var data = request.body.data;
    var keyword = request.params.keyword;
    connection.query('SELECT * FROM courses WHERE name LIKE "%' + keyword + '%" OR category LIKE "%' + keyword + '%" OR detail LIKE "%' + keyword + '%"', (err, results) => {
        if (err) {
            throw err;
            response.status(404).send("Can not found users");
        }
        else {
            response.status(200).json(results);
        }
    });
});

app.get('/profile/user/(:keyword)', function (request, response) {
    //var data = request.body.data;
    var keyword = request.params.keyword;
    connection.query('SELECT email,username,fullname,detail,gender,address,phone FROM accounts WHERE email = ?',[keyword], (err, results) => {
        if (err) {
            throw err; 
            response.status(404).send("Can not found users");
        }
        else {
            response.status(200).json(results);
        }
    });
});

app.post('/signin-with-google', function (request, response) {
    console.log(request.body);
    var user_data = request.body;
    connection.query('SELECT * FROM accounts WHERE email = ?',[user_data.email], (err, results) => {
        if (results.length > 0) {
            const user = {
                email: results[0].email,
                username: results[0].username,
                fullname: results[0].fullname,
                gender: results[0].gender,
                detail: results[0].detail,
                address: results[0].address,
                phone: results[0].phone,
                confirmed: results[0].confirmed,
                user_class: results[0].user_class
            };
            const accessToken = generateAccessToken(user);
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
            response.status(200).json({ user: user, access_token: accessToken, refresh_token: refreshToken });
        }
        else {
            connection.query('INSERT INTO accounts(email,fullname,user_class,confirmed) VALUE(?,?,4,0)', [user_data.email, user_data.fullname], (err, results) => {
                if (err) {
                    response.status(200).send("Please try again..");
                } else {
                    const user = {
                        email: user_data.email,
                        name: user_data.fullname,
                        user_class: 4,
                        confirmed: 0
                    };
                    response.status(200).json(user);
                }
            });
        }
    });
});

app.post('/enroll/(:id)', (request, response) => {
    var id = request.params.id;
    var email = request.body.email;
    var status = request.body.status;
    connection.query('INSERT INTO enroll(user_email,course_id,status) VALUE(?,?,?)', [email, id, status], (err, results) => {
        if (err) {
            response.status(200).send("Please try again..");
        } else {
            const data = {
                user_email: email,
                course_id: id,
                status: status
            };
            response.status(200).json(data);
        }
    });
})

app.get('/check-enroll-status/(:email)/(:course_id)', (request, response) => {
    var id = request.params.id;
    var email = request.params.email;
    connection.query('SELECT * FROM enroll WHERE user_email=? AND course_id=?', [email, id], (err, results) => {
        if (results.length > 0) {
            const data = {
                status: 1
            };
            response.status(200).json(data);
        } else {
            const data = {
                status: 0
            };
            response.status(200).json(data);
        }
    });
})

//<================>
// app is on port...
//<================>
console.log('App listen on port 4000');
app.listen(4000);