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
    var userclass = 1;
    var check_class_from_mail = (email.split('@'))[1].split('.');
    if (check_class_from_mail[0] != 'email' || 'gmail' || 'yahoo') {
        userclass = 2;
    }
    var name = request.body.name;
    var surname = request.body.name;
    var fullname = name + " " + surname;
    connection.query('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, email], function (error, results, fields) {
        if (results.length > 0) {
            response.status(404).send("Account is already exists");
        } else {
            connection.query('INSERT INTO accounts(username, password, user_class, email) VALUES(?,?,?,?)', [username, password, userclass, email], (err, result) => {
                if (err) {
                    throw err;
                    response.status(404).send("Can not create new account");
                } else {
                    sendEmailTo(email, fullname);
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

exports.forgot = function (request, response) {
    var email = request.body.email;
    connection.query('SELECT * FROM accounts WHERE email = ?', [email], function (error, results, fields) {
        if (results.length > 0) {
            sendEmailTo(email, "", forgot);
            response.status(200).send("Change password link sent to your E-mail");
        } else {
            response.status(404).send("Invalid email");
        }
    });
}

exports.search = function (request, response) {

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
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}


function sendEmailTo(email, name, type) {
    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: { // ข้อมูลการเข้าสู่ระบบ
            user: 'com5630159@gmail.com', // email user ของเรา
            pass: 'aspirine1' // email password
        }
    });
    // เริ่มทำการส่งอีเมล
    switch (type) {
        case signup:
            var info = transporter.sendMail({
                from: '"Administrator" <com5630159@gmail.com>', // อีเมลผู้ส่ง
                to: email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
                subject: 'Welcome to KMUTNB online course', // หัวข้ออีเมล
                text: 'Hi ' + name + ', thanks for joining KMUTNB online course.', // plain text body
                html: '<b>Hi ' + name + ', thanks for joining KMUTNB online course.</b>' // html body
            });
            break;
        case forgot: //send link to change password
            var info = transporter.sendMail({
                from: '"Administrator" <com5630159@gmail.com>', // อีเมลผู้ส่ง
                to: email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
                subject: 'Recover your account', // หัวข้ออีเมล
                text: 'Change your password. Just click the link below, and change your new password in website.', // plain text body
                html: '<h2>Change your password.</h2><br><p>Just click the link below, and change your new password in website.</p>' // html body
            });
            break;
        case changedpassword:
            var info = transporter.sendMail({
                from: '"Administrator" <com5630159@gmail.com>', // อีเมลผู้ส่ง
                to: email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
                subject: 'Your password has been changed', // หัวข้ออีเมล
                text: 'Hi ' + email + '. Your password has been changed successfully. You can login to website immediately.', // plain text body
                html: '<h2>Hi ' + email + '.</h2><br><p>Your password has been changed successfully. You can login to website immediately.</p>' // html body
            });
            break;
    }
    
    // log ข้อมูลการส่งว่าส่งได้-ไม่ได้
    //console.log('Message sent: %s', info.messageId);
}
