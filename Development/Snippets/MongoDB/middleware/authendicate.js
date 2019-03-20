var { User } = require('./../models/user');
var authendicate = (req, res, next) => {
    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if(!user) {
            console.log("Fail")
            return Promise.reject();
        }
        
        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {
        res.status(401).send('Error!');
    });
};

module.exports = { authendicate };