const config = require('./../../config');

function IsValidUsername(username) {
    var pattern = config.LOGIN.USERNAME.PATTERN
    if(!(new RegExp(pattern.substr(1, pattern.length-2)).test(username)))
        return false;

    return true;
}

function IsValidPassword(password) {
    var pattern = config.LOGIN.PASSWORD.PATTERN
    if(!(new RegExp(pattern.substr(1, pattern.length-2)).test(password)))
        return false;

    return true;
}

function IsValidName(name) {
    return true;
}

function IsValidEmail(email) {
    var pattern = config.LOGIN.EMAIL.PATTERN
    if(!(new RegExp(pattern.substr(1, pattern.length-2)).test(email)))
        return false;

    return true;
}

function IsValidRole(role) {
    return true;
}

function IsValidStudentID(studentId) {
    return true;
}

module.exports = {
    IsValidUsername,
    IsValidPassword,
    IsValidName,
    IsValidEmail,
    IsValidRole,
    IsValidStudentID
};

