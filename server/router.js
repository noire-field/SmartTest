const passport = require('passport');
const { Log } = require('./utils/logger');

module.exports.register = function(app) {
    app.get('/register', (req, res) => {
        console.log(req.sessionID);
        res.send("OK");
    });

    app.post('/login', (req, res, next) => {
        passport.authenticate('local', (error, user, info) => {
            Log('SESSION PASSPORT: ' + JSON.stringify(req.session.passport));
            Log('USER: ' + JSON.stringify(req.user));
            req.login(user, (error) => {
                Log('SESSION PASSPORT: ' + JSON.stringify(req.session.passport));
                Log('USER: ' + JSON.stringify(req.user));
                return res.send('Logged');
            });
        })(req, res, next);
    });

    // Admin sections
    app.get('/dashboard', (req, res) => {
        res.render('dashboard/index', {
            head_title: 'Trang chủ quản lý - SmartTest',
        })
    });
}