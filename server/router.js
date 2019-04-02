const passport = require('passport');
const { Log } = require('./utils/logger');

module.exports.register = function(app) {
    app.get('/register', (req, res) => {
        console.log(req.sessionID);
        res.send("OK");
    });

    app.post('/login', (req, res, next) => {
        if(req.isAuthenticated())
           return res.json({ success: false, message: 'Already logged on.', redirect: true });

        passport.authenticate('local', (error, user, info) => {
            if(error) {
                Log(`[router.js/login] ERROR: ${JSON.stringify(error)}`);
                return res.json({ success: false, message: 'Unable to connect to database.', redirect: false });
            } else if(!user) {
                return res.json({ success: false, message: 'Username or password is incorrect.', redirect: false });
            }

            req.login(user, (error) => {
                if(error) {
                    Log(`[router.js/login] ERROR: ${JSON.stringify(error)}`);
                    return res.json({ success: false, message: 'Unable to connect to database.', redirect: false });
                }

                return res.json({ success: true, firstName: req.user.FirstName });
            });
        })(req, res, next);
    });

    app.get('/logged', (req, res, next) => {
        res.send(req.isAuthenticated() ? 'Logged In' : 'Not Logged In');
    });

    // Admin sections
    app.get('/dashboard', (req, res) => {
        res.render('dashboard/index', {
            head_title: 'Trang chủ quản lý - SmartTest',
        })
    });
}