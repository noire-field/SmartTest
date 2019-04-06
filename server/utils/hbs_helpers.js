const config = require('./../../config');

module.exports = {
    registerHelpers: function(hbs) {
        hbs.registerHelper('GetLoginInfo', function(type) {
            switch(type) {
                case 0: return config.LOGIN.USERNAME.PATTERN;
                case 1: return config.LOGIN.PASSWORD.PATTERN;
                case 2: return `${config.LOGIN.USERNAME.MIN} ~ ${config.LOGIN.USERNAME.MAX}`;
                case 3: return `${config.LOGIN.PASSWORD.MIN} ~ ${config.LOGIN.PASSWORD.MAX}`;
            }
        });
    }
}