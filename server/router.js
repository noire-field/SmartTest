const passport = require('passport');
const { Log } = require('./utils/logger');
const config = require('./../config');
const { QueryNow, GetPageLimit } = require('./database');

const { Controller_Users } = require('./controllers/users');
const { Controller_Subjects } = require('./controllers/subjects');
const { Controller_Quests } = require('./controllers/quests');
const { Controller_Tests } = require('./controllers/tests');

module.exports.register = function(app) {
    app.get('/register', (req, res) => {
        console.log(req.sessionID);
        res.send("OK");
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
}