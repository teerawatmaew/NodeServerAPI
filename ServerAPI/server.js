require("dotenv").config();

var mysql = require('mysql');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var jwt = require("jsonwebtoken");
var fs = require('fs');

var app = express();

var omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY,
});

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


//<=============================================>
//<================ course api =================>
//<=============================================>

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
            response.status(204).send("Can not found course");
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
                    response.status(204).send("Can not create new course");
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
    var amount = request.body.amount;
    connection.query('SELECT * FROM course WHERE id = ?', [id], function (error, results, fields) {
        if (results.length > 0) {
            connection.query('UPDATE course SET name=?, number_limit=?, register_startdate=?, register_enddate=?, startdate=?, enddate=?, create_by=?, create_date=?, update_by=?, update_date=?, user_owner=?, location=?, type=?, contact=?, active=?, logo_img=?, amount=? WHERE id=?',
                [name, limit, registerstart, registerend, start, end, createby, createdate, updateby, updatedate, owner, location, type, contact, active, logo, amount, id], (err, result) => {
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
                                logo_img: logo,
                                amount: amount
                            }
                        });
                    }
                });
        } else {
            connection.query('INSERT INTO course(id, name, number_limit, register_startdate, register_enddate, startdate, enddate, create_by, create_date, user_owner, location, type, contact, active, logo_img, amount) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)',
                [id, name, limit, registerstart, registerend, start, end, createby, createdate, owner, location, type, contact, logo, amount], (err, result) => {
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
                            logo_img: logo,
                            amount: amount
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
    var keyword = request.params.keyword;
    connection.query('SELECT email,username,fullname,detail,gender,address,phone FROM accounts WHERE email = ?',[keyword], (err, results) => {
        if (err) {
            throw err; 
            response.status(204).send("Can not found users");
        }
        else {
            response.status(200).json(results);
        }
    });
});

app.post('/signin', function (request, response) {
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
                user_class: results[0].user_class,
                id_number: results[0].id_number
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

app.put('/account/(:email)', function (request, response) {
    var user = request.body;
    console.log(user);
    var email = request.params.email;
    connection.query('UPDATE accounts SET gender=?,detail=?,address=?,phone=?,confirmed=?,user_class=?,id_number=? WHERE email=?', [user.gender, user.detail, user.address, user.phone, user.confirmed, user.user_class, user.id_number, email], (err, results) => {
        const user = {
            email: results[0].email,
            username: results[0].username,
            fullname: results[0].fullname,
            gender: results[0].gender,
            detail: results[0].detail,
            address: results[0].address,
            phone: results[0].phone,
            confirmed: results[0].confirmed,
            user_class: results[0].user_class,
            id_number: results[0].id_number
        };
        if (err) {
            response.status(204).send(user);
        } else {
            response.status(200).send(user);
        }
    });
});

//=================================================
//==================== Enroll =====================
//=================================================

app.post('/enroll/(:id)', (request, response) => {
    var id = request.params.id;
    var email = request.body.user_email;
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

app.get('/enroll-status/(:email)/(:course_id)', (request, response) => {
    var id = request.params.course_id;
    var email = request.params.email;
    connection.query('SELECT * FROM enroll WHERE user_email=? AND course_id=?', [email, id], (err, results) => {
        console.log(results);
        if (results.length > 0) {
            const data = {
                enroll_status: 0
            };
            response.status(200).json(data);
        } else {
            const data = {
                enroll_status: 1
            };
            response.status(200).json(data);
        }
    });
})

app.get('/unenroll/(:email)/(:course_id)', (request, response) => {
    var id = request.params.course_id;
    var email = request.params.email;
    connection.query('DELETE FROM enroll WHERE user_email=? AND course_id=?', [email, id], (err, results) => {
        console.log(results);
        if (results.length > 0) {
            const data = {
                enroll_status: 0
            };
            response.status(200).json(data);
        } else {
            const data = {
                enroll_status: 1
            };
            response.status(200).json(data);
        }
    });
})

app.get('/enrollment', (request, response) => {
    connection.query('SELECT * FROM enroll', (err, results) => {
        if (results.length > 0) {
            response.status(200).json(results);
        } else {
            response.status(200).json("No data");
        }
    });
})

app.get('/enrollment/allcount', (request, response) => {
    connection.query('SELECT course_id, name, Count(course_id) AS enrolled FROM enroll, course WHERE enroll.course_id = course.id GROUP BY course_id;', (err, results) => {
        if (results.length > 0) {
            response.status(200).json(results);
        } else {
            response.status(200).json("No data");
        }
    });
})

app.get('/course-enroll/(:email)', (request, response) => {
    var email = request.params.email;
    connection.query('SELECT enroll.id AS enroll_id,course.id,name,status FROM course,enroll WHERE course.id=enroll.course_id AND enroll.user_email =?', [email], (err, results) => {
        if (results.length > 0) {
            response.status(200).json(results);
        } else {
            const data = {
                enroll_id: 'nodata',
                id: 'nodata',
                name: 'nodata',
                status: 0
            };
            response.status(200).json(data);
        }
    });
})

app.get('/course-enroll/course/(:id)', (request, response) => {
    var id = request.params.id;
    var query = 'SELECT enroll.id AS enroll_id, course.id, name, fullname, user_email, status, id_number FROM course, enroll, accounts WHERE enroll.course_id = course.id AND enroll.user_email = accounts.email AND enroll.course_id =?';
    connection.query(query, [id], (err, results) => {
        if (results.length > 0) {
            response.status(200).json(results);
        } else {
            response.status(200).json("No data");
        }
    });
})

//====================================================
//================= Payment API ======================
//====================================================

app.get('/course-amount/(:course_id)', (request, response) => {
    connection.query('SELECT id,name,amount FROM course WHERE id=?', [request.params.course_id], (err, results) => {
        if (results.length > 0) {
            response.status(200).json({ course: results });
        } else {
            response.status(200).json("No data");
        }
    });
})


app.post('/checkout-credit-card/', async (req, res, next) => {
    console.log(req.body);
    var amount = req.body.amount;
    try {
        const customer = await omise.customers.create({
            'email': req.body.email,
            'description': req.body.name,
            'card': req.body.token,
        });

        const charge = await omise.charges.create({
            'amount': amount,
            'currency': 'thb',
            'customer': customer.id,
        });
        console.log("Charge => ", charge);
        if (charge.status == "successful") {
            var detail = 'Bank : ' + charge.card.bank + '(' + charge.card.brand + ') Card Number : xxxx-xxxx-xxxx-'+ charge.card.last_digits +' Name on Card : ' + charge.card.name;
            connection.query('INSERT INTO transaction VALUES(?,?,?,?,?,?,?,?)', [charge.id, req.body.email, req.body.course_id, charge.amount, charge.card.financing, charge.paid_at, charge.status, detail], (err, results) => {
                if (err) {
                    res.status(200).json(err);
                }
            });
        }
        res.status(200).json({ amount: charge.amount, status: charge.status });
    } catch (error) {
        console.log(error);
    }
    next();
})

app.get('/transaction-email/(:email)', (request, response) => {
    var email = request.params.email;
    connection.query('SELECT * FROM transaction WHERE user_email=?', [email], (err, results) => {
        if (results.length > 0) {
            response.status(200).json(results);
        } else {
            response.status(200).json("No data");
        }
    });
})

app.get('/transaction-id/(:charge_id)', (request, response) => {
    var charge_id = request.params.charge_id;
    connection.query('SELECT * FROM transaction WHERE charge_id=?', [charge_id], (err, results) => {
        if (results.length > 0) {
            response.status(200).json({ charge:results });
        } else {
            response.status(200).json("No data");
        }
    });
})

//<================>
// app is on port...
//<================>
console.log('App listen on port 4000');
app.listen(4000);