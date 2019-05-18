const passport = require('passport');
const { Log } = require('./utils/logger');
const config = require('./../config');
const { QueryNow, GetPageLimit } = require('./database');

const User = require('./utils/user');

const { Controller_Users } = require('./controllers/users');
const { Controller_Subjects } = require('./controllers/subjects');
const { Controller_Quests } = require('./controllers/quests');
const { Controller_Tests } = require('./controllers/tests');

const activeTest = require('./activeTest');

module.exports.register = function(app) {
    app.get('/register', (req, res) => {
        if(req.isAuthenticated()) 
            return req.query.redirect ? res.redirect(req.query.redirect) : res.redirect('/');

        res.render('register', {
            head_title: 'Đăng ký - ' + config.APP_NAME,
            redirect: req.query.redirect
        });
    });

    app.post('/register', (req, res, next) => {
        var errors = [];
        
        try {
            var thisUser = {
                Username: req.body.username,
                Password: req.body.password,
                Email: "",
                RoleType: req.body.roleType,
                FirstName: req.body.firstName,
                LastName: req.body.lastName,
                StudentID: req.body.studentId
            };
    
            if(!User.IsValidUsername(thisUser.Username))
                errors.push(`Tên tài khoản không hợp lệ (Chỉ gồm chữ, số, gạch dưới và ${config.LOGIN.USERNAME.MIN}-${config.LOGIN.USERNAME.MAX} ký tự)`);
            if(thisUser.Password.length > 0 && !User.IsValidPassword(thisUser.Password))
                errors.push(`Mật khẩu không hợp lệ (Chỉ ${config.LOGIN.PASSWORD.MIN}-${config.LOGIN.PASSWORD.MAX} ký tự)`);
            //if(!User.IsValidEmail(thisUser.Email))
            //    errors.push(`Email không hợp lệ`);
            if(!User.IsValidRole(thisUser.RoleType) || thisUser.RoleType > 1)
                errors.push(`Quyền hạn không hợp lệ`);
            if(!User.IsValidName(thisUser.FirstName) || !User.IsValidName(thisUser.LastName))
                errors.push(`Tên hoặc Họ không hợp lệ`);
            if(!User.IsValidStudentID(thisUser.StudentID))
                errors.push(`Mã Sinh Viên không hợp lệ`); 
        } catch(e) {
            return res.send({ status: false, message: "Có gì đó bị hỏng, vui lòng liên hệ quản trị viên" });
        }

        if(errors.length > 0) 
            return res.send({ status: false, message: errors[0] });

        QueryNow(`SELECT UserID FROM users WHERE Username = ?`, [thisUser.Username])
        .then((rows) => {
            if(rows.length > 0) 
                return res.send({ status: false, message: "Tên tài khoản đã có người sử dụng" });

            return QueryNow("INSERT INTO users (Username, Password, FirstName, LastName, RoleType, RegisteredDate, StudentID) VALUES(?,?,?,?,?,NOW(),?);",
            [thisUser.Username, thisUser.Password, thisUser.FirstName, thisUser.LastName, thisUser.RoleType, thisUser.StudentID]);
        })
        .then((rows) => {
            return res.send({ status: true });
        })
        .catch((error) => {
            console.log(error);
            return res.send({ status: false, message: "Không thể kiểm tra trùng lặp tên" });
        })
    });

    // Login page
    app.get('/login', (req, res, next) => {
        if(req.isAuthenticated()) 
            return req.query.redirect ? res.redirect(req.query.redirect) : res.redirect('/');

        res.render('login', {
            head_title: 'Đăng nhập - ' + config.APP_NAME,
            redirect: req.query.redirect
        });
    });

    app.post('/login', (req, res, next) => {
        if(req.isAuthenticated())
           return res.json({ success: false, message: 'Bạn đã đăng nhập rồi...', redirect: true });

        passport.authenticate('local', (error, user, info) => {
            if(error) {
                Log(`[router.js/login] ERROR: ${JSON.stringify(error)}`);
                return res.json({ success: false, message: 'Không thể kết nối tới CSDL...', redirect: false });
            } else if(!user) {
                return res.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu chưa đúng...', redirect: false });
            }

            req.login(user, (error) => {
                if(error) {
                    Log(`[router.js/login] ERROR: ${JSON.stringify(error)}`);
                    return res.json({ success: false, message: 'Không thể kết nối tới CSDL...', redirect: false });
                }

                return res.json({ success: true, firstName: req.user.FirstName });
            });
        })(req, res, next);
    });

    app.get('/logout', (req, res, next) => {
        if(req.isAuthenticated()) 
            req.logout();

        res.redirect(req.query.redirect ? req.query.redirect : '/login');
    });

    app.get('/logged', (req, res, next) => {
        res.send(req.isAuthenticated() ? 'Logged In' : 'Not Logged In');
    });

    // Admin sections (GET)
    app.get('/dashboard/:page?/:action?/:id?', (req, res, next) => {
        if(!req.isAuthenticated()) // Check login
            return res.redirect('/login?redirect=/dashboard');
        if(req.user.RoleType < 1) // Only Lecturer or Administrator can access
            return res.redirect('/');

        var { page, action, id } = req.params;

        switch(page) {
            case undefined:
            case null:
                res.render('dashboard/index', {
                    page: 'index',
                    head_title: 'Trang quản lý - ' + config.APP_NAME,
                    user: req.user
                })
                break;
            case 'users': Controller_Users(0, action, id, req, res, next); break;
            case 'subjects': Controller_Subjects(0, action, id, req, res, next); break;
            case 'quests': Controller_Quests(0, action, id, req, res, next); break;
            case 'tests': Controller_Tests(0, action, id, req, res, next); break;
            default: 
                res.render('error', { errorMessage: 'Trang này không tồn tại.' }); 
                break;
        }
    });

    // Action sections (POST)
    app.post('/dashboard/:page?/:action?/:id?', (req, res, next) => {
        if(!req.isAuthenticated()) // Check login
            return res.redirect('/login?redirect=/dashboard');
        if(req.user.RoleType < 1) // Only Lecturer or Administrator can access
            return res.redirect('/');

        var { page, action, id } = req.params;

        switch(page) {
            case 'users': Controller_Users(1, action, id, req, res, next); break;
            case 'subjects': Controller_Subjects(1, action, id, req, res, next); break;
            case 'quests': Controller_Quests(1, action, id, req, res, next); break;
            case 'tests': Controller_Tests(1, action, id, req, res, next); break;
            default:
                return res.redirect('/');
        }
    });

    // Test Socket
    app.get('/socket', (req, res, next) => {
        return res.render('testSocket');
    });

    // Homepage
    app.get('/', (req, res, next) => {
        return res.render('index', {
            head_title: 'Trang chủ - ' + config.APP_NAME,
            isUserLogged: req.isAuthenticated(),
            user: req.isAuthenticated() ? req.user : null
        });
    });

    app.get('/findroom/:pin?', (req, res, next) => {
        var pin = req.params.pin ? req.params.pin : -1;

        if(!req.isAuthenticated())
            return res.json({ status: false, message: "Vui lòng đăng nhập trước" });
        if(req.user.RoleType != 0) 
            return res.json({ status: false, message: "Chỉ có tài khoản sinh viên mới được thực hiện kiểm tra" });
        if(!(new RegExp(/^\d{5}$/).test(pin)))
            return res.json({ status: false, message: "Mã pin không hợp lệ" });

        QueryNow(`SELECT t.TestName, t.TestTime, u.FirstName FROM tests t INNER JOIN users u ON t.OwnerID = u.UserID WHERE t.PINCode = ? AND t.OpenStatus = 1`, [pin])
        .then((rows) => {
            if(rows.length <= 0)
                return res.json({ status: false, message: "Bài kiểm tra không tồn tại, có thể chưa mở hoặc sai mã PIN." });

            return res.json({ status: true, testName: rows[0].TestName, testTime: rows[0].TestTime, testOwner: rows[0].FirstName });
        })
        .catch((error) => {
            return res.json({ status: false, message: "Đã xảy ra lỗi phía server" });
        })
    });

    app.get('/joinroom/:pin?', (req, res, next) => {
        var pin = req.params.pin ? req.params.pin : -1;

        if(!req.isAuthenticated())
            return res.redirect('/');
        if(req.user.RoleType != 0) 
            return res.redirect('/');
        if(!(new RegExp(/^\d{5}$/).test(pin)))
            return res.redirect('/');

        QueryNow(`SELECT t.TestID FROM tests t WHERE t.PINCode = ? AND t.OpenStatus = 1`, [pin])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/');

            return activeTest.JoinTest(Number(rows[0].TestID), req.user);
        })
        .then((result) => {
            return res.redirect('/testing');
        })
        .catch((error) => {
            return res.redirect('/');
        })
    });

    app.get('/testing', (req, res, next) => {
        if(!req.isAuthenticated())
            return res.redirect('/');
        if(req.user.RoleType != 0) 
            return res.redirect('/');

        QueryNow(`SELECT st.TestID FROM studenttests st INNER JOIN tests t ON st.TestID = t.TestID WHERE st.UserID = ? AND t.OpenStatus IN (1,2)`, [req.user.UserID])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/');

            return res.render('testing', {
                head_title: 'Kiểm tra - ' + config.APP_NAME,
                user: req.user,
                testId: Number(rows[0].TestID)
            });
        })
        .catch((error) => {
            return res.redirect('/');
        })
    });
}