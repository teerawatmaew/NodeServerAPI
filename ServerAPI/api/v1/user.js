require("dotenv").config();
process.env.PWD = process.cwd()

var jwt = require("jsonwebtoken");
var mysql = require('mysql');
var nodemailer = require('nodemailer');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'nodelogin'
});


exports.signup = function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    var email = request.body.email;
    var userclass = 3;
    connection.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function (error, results, fields) {
        if (results.length > 0) {
            response.status(404).send("Account is already exists");
        } else {
            connection.query('INSERT INTO accounts(username, password, user_class, email) VALUES(?,?,?,?)', [username, password, userclass, email], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send("Can not create new account");
                } else {
                    response.status(200).send("Completed to create account");
                }
            });
        }
    });
}

exports.login = function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            if (results[0].user_class == 1) {
                const user = {
                    name: username,
                    isadmin: "yes"
                };
                const accessToken = generateAccessToken(user);
                const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
                //refreshTokens.push(refreshToken);
                response.json({ accessToken: accessToken, refreshToken: refreshToken });
            }
            else {
                const user = {
                    name: username,
                    isadmin: "no"
                };
                const accessToken = generateAccessToken(user);
                const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
                //refreshTokens.push(refreshToken);
                response.json({ accessToken: accessToken, refreshToken: refreshToken });
            }
        } else {
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    });
}

exports.profile = function (request, response) {
    //if (request.user.isadmin == "yes") { response.status(403).send("You're ADMIN!!"); } else {
    connection.query('SELECT * FROM accounts WHERE username = ?', [request.user.name], function (error, results, fields) {
        if (results.length > 0) response.status(200).json(results);
    });
    //}
}

exports.editprofile = function (request, response) {
    var username = request.body.editusername;
    var password = request.body.editpassword;
    var email = request.body.editemail;
    var userclass = request.body.edituserclass;
    connection.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function (error, results, fields) {
        if (results.length > 1) {
            response.status(404).send("Account or E-mail are already exists");
        } else {
            connection.query('UPDATE accounts SET username=?, password=?, user_class=?, email=? WHERE username=?', [username, password, userclass, email, request.user.name], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send("Can not update this account");
                } else {
                    response.status(200).send("Update completed");
                }
            });
        }
    });
}

exports.readall = function (request, response) {
    //if (request.user.admin == true) { response.status(403).send("access denied"); } else {
    connection.query('SELECT * FROM accounts', (err, results) => {
        if (err) {
            throw err;
            response.status(404).send("Can not found users");
        }
        else {
            //sendEmailTo("teerawatmaew@gmail.com");
            response.status(200).json(results);
        };
    });
}

exports.read = function (request, response) {
    connection.query('SELECT * FROM accounts WHERE id = ' + request.params.id, function (err, result) {
        if (err) {
            throw err;
            response.status(404).send("Can not found user");
        } else {
            response.status(200).json(result);
        }
    });
}

exports.create = function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    var email = request.body.email;
    var userclass = request.body.userclass;
    connection.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function (error, results, fields) {
        if (results.length > 0) {
            response.status(404).send("Account is already exists");
        } else {
            connection.query('INSERT INTO accounts(username, password, user_class, email) VALUES(?,?,?,?)', [username, password, userclass, email], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send("Can not create new account");
                } else {
                    response.status(200).send("Completed to create account");
                }
            });
        }
    });
}

exports.update = function (request, response) {
    var id = request.params.id;
    var username = request.body.editusername;
    var password = request.body.editpassword;
    var email = request.body.editemail;
    var userclass = request.body.edituserclass;
    connection.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function (error, results, fields) {
        if (results.length > 1) {
            response.status(404).send("Account or E-mail are already exists");
        } else {
            connection.query('UPDATE accounts SET username=?, password=?, user_class=?, email=? WHERE id=?', [username, password, userclass, email, id], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send("Can not update this account");
                } else {
                    response.status(200).send("Update completed");
                }
            });
        }
    });
}

exports.delete = function (request, response) {
    connection.query('DELETE FROM accounts WHERE id = ' + request.params.id, function (err, result) {
        if (err) {
            throw err;
            response.status(404).send("Can not delete this account");
        } else {
            response.status(200).send("Delete completed");
        }
    });
}

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


function sendEmailTo(email) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: { // ข้อมูลการเข้าสู่ระบบ
            user: 'com5630159@gmail.com', // email user ของเรา
            pass: 'aspirine1' // email password
        }
    });
    // เริ่มทำการส่งอีเมล
    let info = transporter.sendMail({
        from: '"Administrator" <com5630159@gmail.com>', // อีเมลผู้ส่ง
        to: email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
        subject: 'Welcome to KMUTNB online course', // หัวข้ออีเมล
        text: 'Hi ' + email + ', thanks for joining KMUTNB online course.', // plain text body
        html: '<b>Hi ' + email + ', thanks for joining KMUTNB online course.</b>' // html body
    });
    // log ข้อมูลการส่งว่าส่งได้-ไม่ได้
    //console.log('Message sent: %s', info.messageId);
}
