module.exports.register = function(app) {

    // Admin sections
    app.get('/dashboard', (req, res) => {
        res.render('dashboard/index', {
            head_title: 'Trang chủ quản lý - SmartTest',
        })
    });
}