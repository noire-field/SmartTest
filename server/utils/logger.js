module.exports = {
    Log
}

function Log(text) {
    console.log(text);
}

function ErrorHandler(res, msg) {
    res.render('error', { errorMessage: msg });
}