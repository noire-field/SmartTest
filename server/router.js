const passport = require('passport');
const { Log } = require('./utils/logger');
const config = require('./../config');
const { QueryNow, GetPageLimit } = require('./database');

const User = require('./utils/user');

const { Controller_Users } = require('./controllers/users');
const { Controller_Subjects } = require('./controllers/subjects');
const { Controller_Quests } = require('./controllers/quests');
const { Controller_Games } = require('./controllers/games');

const activeGames = require('./activeGames');

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
                var promiseTasks = [
                    QueryNow('SELECT COUNT(*) Total FROM users'),
                    QueryNow('SELECT COUNT(*) Total FROM subjects'),
                    QueryNow('SELECT COUNT(*) Total FROM questions'),
                    QueryNow('SELECT COUNT(*) Total FROM games'),
                ]; 
                
                Promise.all(promiseTasks).then((sets) => {
                    res.render('dashboard/index', {
                        page: 'index',
                        head_title: 'Trang quản lý - ' + config.APP_NAME,
                        user: req.user,
                        statUsers: sets[0][0].Total,
                        statSubjects: sets[1][0].Total,
                        statQuests: sets[2][0].Total,
                        statGames: sets[3][0].Total
                    })
                }).catch((error) => {
                    res.render('dashboard/index', {
                        page: 'index',
                        head_title: 'Trang quản lý - ' + config.APP_NAME,
                        user: req.user,
                        statUsers: 0,
                        statSubjects: 0,
                        statQuests: 0,
                        statGames: 0
                    })
                })

                break;
            case 'users': Controller_Users(0, action, id, req, res, next); break;
            case 'subjects': Controller_Subjects(0, action, id, req, res, next); break;
            case 'quests': Controller_Quests(0, action, id, req, res, next); break;
            case 'games': Controller_Games(0, action, id, req, res, next); break;
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
            case 'games': Controller_Games(1, action, id, req, res, next); break;
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
        var data = {
            head_title: 'Trang chủ - ' + config.APP_NAME,
            isUserLogged: false,
            isInGame: false,
            userFullName: ""
        };

        if(req.isAuthenticated()) {
            data.isUserLogged = true;
            data.user = req.user;
            data.isUserAdmin = req.user.RoleType <= 0 ? false : true;
            data.userFullName = `${req.user.LastName} ${req.user.FirstName}`;
        }

        // Okay, is this nigger in a god damn niggame?
        var playerUUID = req.cookies.userGameId || "";
        if(playerUUID.length > 0 && activeGames.IsUserInGame(playerUUID))
            return res.redirect('/playing');

        data.quickJoin = req.query.quickjoin || "";

        return res.render('index', data);
    });

    activeGames.RegisterRoutes(app); // register routes for /present and /play

    /*
    

    

    app.get('/testing', (req, res, next) => {
        if(!req.isAuthenticated())
            return res.redirect('/');
        if(req.user.RoleType != 0) 
            return res.redirect('/');

        QueryNow(`SELECT st.TestID FROM studenttests st INNER JOIN tests t ON st.TestID = t.TestID WHERE st.UserID = ? AND t.OpenStatus IN (1,2)`, [req.user.UserID])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/');

            return res.render('testing_smarttest', {
                head_title: 'Kiểm tra - ' + config.APP_NAME,
                user: req.user,
                testId: Number(rows[0].TestID)
            });
        })
        .catch((error) => {
            return res.redirect('/');
        })
    });

    app.get('/result', (req, res, next) => {
        if(!req.isAuthenticated())
            return res.redirect('/');
        if(req.user.RoleType != 0)
            return res.redirect('/');

        QueryNow(`SELECT t.TestID, t.TestName, tr.CorrectCount, tr.TotalCount, tr.CheckedDate FROM tests t INNER JOIN testresults tr ON t.TestID = tr.TestID WHERE tr.UserID = 6 ORDER BY t.TestID DESC LIMIT 5`, [req.user.UserID])
        .then((rows) => {
            for(let r of rows) {
                if(r.TotalCount > 0 && r.CorrectCount > 0) {
                    r.Mark = Math.round((r.CorrectCount / r.TotalCount * 10) * 100) / 100;
                    r.MarkColor = r.Mark >= 5.0 ? "text-success" : "text-danger";
                } else {
                    r.Mark = 0
                    r.MarkColor = "text-danger";
                }

                r.CheckTime = new Date(r.CheckedDate).toLocaleString();
            }

            return res.render('result', {
                head_title: 'Kết quả kiểm tra - ' + config.APP_NAME,
                user: req.user,
                isAvailable: rows.length > 0 ? true : false,
                listResults: rows
            });
        })
        .catch((error) => {
            return res.redirect('/');
        });
    });

    app.get('/account', (req, res, next) => {
        if(!req.isAuthenticated())
            return res.redirect('/');
        if(req.user.RoleType != 0)
            return res.redirect('/');

        return res.render('account', {
            head_title: 'Cài đặt tài khoản - ' + config.APP_NAME,
            user: req.user
        });
    }); */
}