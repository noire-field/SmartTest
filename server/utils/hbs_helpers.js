const config = require('./../../config');

module.exports.registerHelpers = function(hbs) {
    hbs.registerHelper('GetLoginInfo', function(type) {
        switch(type) {
            case 0: return config.LOGIN.USERNAME.PATTERN;
            case 1: return config.LOGIN.PASSWORD.PATTERN;
            case 2: return `${config.LOGIN.USERNAME.MIN} ~ ${config.LOGIN.USERNAME.MAX}`;
            case 3: return `${config.LOGIN.PASSWORD.MIN} ~ ${config.LOGIN.PASSWORD.MAX}`;
        }
    });
    
    hbs.registerHelper('GetCurrentYear', function() {
        return new Date().getFullYear();
    });

    hbs.registerHelper('GetAvatarUrl', function(fileName) {
        if(fileName) return '/contents/avatars/'+fileName;
        else return '/img/default_avatar.png';
    });
    
    hbs.registerHelper('If', function(a, b, c) {
        if(a == b) return c;
        else return '';
    })

    hbs.registerHelper('GetAdminPageUrl', function(section) {
        var dashboardUrl = '/dashboard';

        switch(section) {
            case 'Users': return dashboardUrl + '/users';
            case 'Subjects': return dashboardUrl + '/subjects';
            case 'Quests': return dashboardUrl + '/quests';
            case 'Tests': return dashboardUrl + '/tests';
            default: return dashboardUrl;
        }
    });
}