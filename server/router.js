const passport = require('passport');
const { Log } = require('./utils/logger');
const config = require('./../config');
const { QueryNow, GetPageLimit } = require('./database');
const User = require('./utils/user');
const Subject = require('./utils/subject');

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
                    user: req.usergit
                })
                break;
            case 'users':
                Controller_Users(0, action, id, req, res, next);
                break;
            case 'subjects':
                Controller_Subjects(0, action, id, req, res, next);
                break;
            default:
                res.render('error', { errorMessage: 'Trang này không tồn tại.' });
                break;
        }
    });

    app.post('/dashboard/:page?/:action?/:id?', (req, res, next) => {
        if(!req.isAuthenticated()) // Check login
            return res.redirect('/login?redirect=/dashboard');
        if(req.user.RoleType < 1) // Only Lecturer or Administrator can access
            return res.redirect('/');

        var { page, action, id } = req.params;

        switch(page) {
            case 'users':
                Controller_Users(1, action, id, req, res, next);
                break;
            case 'subjects':
                Controller_Subjects(1, action, id, req, res, next);
                break;
            default:
                return res.redirect('/');
        }
    });
}

function Controller_Users(type, action, id, req, res, next) 
{
    if(req.user.RoleType < 2)
        return res.redirect('/dashboard');

    if(type == 0) { // GET
        switch(action)
        {
            case null:
            case undefined: // View list
                var page = req.query.page ? req.query.page : 1;
                var pagination = [page, 1];
    
                QueryNow(`SELECT COUNT(UserID) AS TOTAL FROM users`)
                .then((rows) => {
                    var { START, LIMIT } = GetPageLimit(page, rows[0].TOTAL, config.ITEM_PER_PAGE);
                    pagination = [page, Math.ceil(rows[0].TOTAL / config.ITEM_PER_PAGE)];
    
                    return QueryNow(`SELECT UserID, Username, FirstName, LastName, RoleType, RegisteredDate, AvatarFile, StudentID FROM users LIMIT ${START}, ${LIMIT}`);
                })
                .then((rows) => {
                    res.render('dashboard/users/index', {
                        page: 'users',
                        head_title: `Quản lý người dùng - ${config.APP_NAME}`,
                        user: req.user,
                        userList: rows,
                        pagination: { 
                            URL: '/dashboard/users?page=',
                            CURRENT: pagination[0], 
                            TOTAL: pagination[1] 
                        }
                    });
                })
                .catch((error) => {
                    Log(error);
                    ErrorHandler(res, 'Oops... Something went wrong...');
                })
    
                break;
            case 'edit':
                Render_EditPage(id, res, req, { status: 'none' });
                break;
            case 'delete':
                Render_DeletePage(id, res, req, { status: 'none' });
                break;
            default:
                res.render('error', { errorMessage: 'Trang này không tồn tại.' });
                break;
        }
    } else { // POST
        switch(action)
        {
            case 'edit':
                if(!id) return res.redirect('/dashboard/users');

                QueryNow(`SELECT UserID, Username, Email, FirstName, LastName, RoleType, StudentID FROM users WHERE UserID = ?`, [id])
                .then((rows) => {
                    if(rows.length <= 0)
                        return res.redirect('/dashboard/users');

                    var errors = [];

                    let thisUser = {
                        Username: req.body['input-username'],
                        Password: req.body['input-password'],
                        Email: req.body['input-email'],
                        RoleType: req.body['input-roletype'],
                        FirstName: req.body['input-firstname'],
                        LastName: req.body['input-lastname'],
                        StudentID: req.body['input-studentid']
                    };

                    if(!User.IsValidUsername(thisUser.Username))
                        errors.push(`Tên tài khoản không hợp lệ (Chỉ gồm chữ, số, gạch dưới và ${config.LOGIN.USERNAME.MIN}-${config.LOGIN.USERNAME.MAX} ký tự)`);
                    if(thisUser.Password.length > 0 && !User.IsValidPassword(thisUser.Password))
                        errors.push(`Mật khẩu không hợp lệ (Chỉ ${config.LOGIN.PASSWORD.MIN}-${config.LOGIN.PASSWORD.MAX} ký tự)`);
                    if(!User.IsValidEmail(thisUser.Email))
                        errors.push(`Email không hợp lệ`);
                    if(!User.IsValidRole(thisUser.RoleType))
                        errors.push(`Quyền hạn không hợp lệ`);
                    if(!User.IsValidName(thisUser.FirstName) || !User.IsValidName(thisUser.LastName))
                        errors.push(`Tên hoặc Họ không hợp lệ`);
                    if(!User.IsValidStudentID(thisUser.StudentID))
                        errors.push(`Mã Sinh Viên không hợp lệ`); 

                    if(errors.length <= 0) {
                        if(thisUser.Password.length > 0) {
                            var q = QueryNow(`UPDATE users SET Username = ?, Password = ?, Email = ?, FirstName = ?, LastName = ?, RoleType = ?, StudentID = ? WHERE UserID = ?`,
                            [thisUser.Username, thisUser.Password, thisUser.Email, thisUser.FirstName, thisUser.LastName, thisUser.RoleType, thisUser.StudentID, id]);
                        } else {
                            var q = QueryNow(`UPDATE users SET Username = ?, Email = ?, FirstName = ?, LastName = ?, RoleType = ?, StudentID = ? WHERE UserID = ?`,
                            [thisUser.Username, thisUser.Email, thisUser.FirstName, thisUser.LastName, thisUser.RoleType, thisUser.StudentID, id]);
                        }

                        q.then((rows) => {
                            return Render_EditPage(id, res, req, { status: 'success' });
                        }).catch((error) => {
                            Log(error);
                            return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #1'] });
                        })
                    } else {
                        return Render_EditPage(id, res, req, { status: 'error', errors: errors });
                    }
                })
                .catch((error) => {
                    Log(error);
                    return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #2'] });
                })
    
                break;
            case 'delete':
                if(!id) return res.redirect('/dashboard/users');
                
                QueryNow(`SELECT UserID, RoleType FROM users WHERE UserID = ?`, [id])
                .then((rows) => {
                    if(rows.length <= 0)
                        return res.redirect('/dashboard/users');

                    var errors = [];
                    
                    if(rows[0].RoleType >= 2)
                        errors.push(`Không thể xóa một quản trị viên, vui lòng hạ cấp họ xuống trước.`); 

                    if(errors.length <= 0) {
                        var q = QueryNow(`DELETE FROM users WHERE UserID = ?`,[id]);

                        q.then((rows) => {
                            return res.redirect('/dashboard/users');
                        }).catch((error) => {
                            Log(error);
                            return Render_DeletePage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #1'] });
                        })
                    } else {
                        return Render_DeletePage(id, res, req, { status: 'error', errors: errors });
                    }
                })
                .catch((error) => {
                    Log(error);
                    return Render_DeletePage(id, res, req, { status: 'error', errors: ['Không thể xóa do lỗi truy vấn #2'] });
                })

                break;
        }
    }

    function Render_EditPage(id, res, req, extra={}) {
        if(!id) return res.redirect('/dashboard/users');

        QueryNow(`SELECT UserID, Username, Email, FirstName, LastName, RoleType, StudentID FROM users WHERE UserID = ?`, [id])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/dashboard/users');

            res.render('dashboard/users/edit', {
                page: 'users',
                head_title: `Chỉnh sửa người dùng - ${config.APP_NAME}`,
                user: req.user,
                editUser: rows[0],
                ...extra
            });
        })
        .catch((error) => {
            Log(error);
            ErrorHandler(res, 'Oops... Something went wrong...');
        })
    }

    function Render_DeletePage(id, res, req, extra={}) {
        if(!id) return res.redirect('/dashboard/users');

        QueryNow(`SELECT UserID, FirstName FROM users WHERE UserID = ?`, [id])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/dashboard/users');

            res.render('dashboard/users/delete', {
                page: 'users',
                head_title: `Xóa người dùng - ${config.APP_NAME}`,
                user: req.user,
                editUser: rows[0],
                ...extra
            });
        })
        .catch((error) => {
            Log(error);
            ErrorHandler(res, 'Oops... Something went wrong...');
        })
    }
}

function Controller_Subjects(type, action, id, req, res, next) 
{
    if(req.user.RoleType < 1)
        return res.redirect('/dashboard');

    if(type == 0) { // GET
        switch(action)
        {
            case null:
            case undefined: // View list
                var page = req.query.page ? req.query.page : 1;
                var pagination = [page, 1];
    
                QueryNow(`SELECT COUNT(SubjectID) AS TOTAL FROM subjects${req.user.RoleType >= 2 ? `` : ` WHERE OwnerID = '${req.user.UserID}'`}`)
                .then((rows) => {
                    console.log(rows[0].TOTAL);
                    var { START, LIMIT } = GetPageLimit(page, rows[0].TOTAL, config.ITEM_PER_PAGE);
                    pagination = [page, Math.ceil(rows[0].TOTAL / config.ITEM_PER_PAGE)];

                    return QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName, COUNT(q.QuestID) as QuestCount FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID LEFT JOIN questions q ON q.SubjectID = s.SubjectID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`} GROUP BY s.SubjectID, s.SubjectName, u.FirstName, u.LastName LIMIT ${START}, ${LIMIT}`);
                })
                .then((rows) => {
                    res.render('dashboard/subjects/index', {
                        page: 'subjects',
                        head_title: `Quản lý bộ đề - ${config.APP_NAME}`,
                        user: req.user,
                        subjectList: rows,
                        pagination: { 
                            URL: '/dashboard/subjects?page=',
                            CURRENT: pagination[0], 
                            TOTAL: pagination[1] 
                        }
                    });
                })
                .catch((error) => {
                    Log(error);
                    ErrorHandler(res, 'Oops... Something went wrong...');
                })
    
                break;
            case 'add':
                Render_AddPage(id, res, req, { status: 'none' });
                break;
            case 'edit':
                Render_EditPage(id, res, req, { status: 'none' });
                break;
            case 'delete':
                Render_DeletePage(id, res, req, { status: 'none' });
                break;
            default:
                res.render('error', { errorMessage: 'Trang này không tồn tại.' });
                break;
        }
    } else { // POST
        switch(action)
        {
            case 'add':
                var errors = [];

                let thisSubject = {
                    SubjectName: req.body['input-subjectname']
                };
                
                if(!Subject.SubjectName.IsValidName(thisSubject.SubjectName))
                    errors.push(`Tên bộ đề phải từ ${Subject.SubjectName.MIN} đến ${Subject.SubjectName.MAX} ký tự`);

                if(errors.length <= 0) {
                    QueryNow(`INSERT INTO subjects (SubjectName, OwnerID) VALUES(?, ?)`, [thisSubject.SubjectName, req.user.UserID])
                    .then((rows) => {
                        return res.redirect('/dashboard/subjects');
                    }).catch((error) => {
                        Log(error);
                        return Render_AddPage(id, res, req, { status: 'error', errors: ['Không thể thêm do lỗi truy vấn #1'] });
                    })
                } else {
                    return Render_AddPage(id, res, req, { status: 'error', errors: errors });
                }
            
                break;
            case 'edit':
                if(!id) return res.redirect('/dashboard/subjects');

                QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID WHERE s.SubjectID = ?${req.user.RoleType >= 2 ? '' : ` AND s.OwnerID = '${req.user.UserID}'`}`, [id])
                .then((rows) => {
                    if(rows.length <= 0)
                        return res.redirect('/dashboard/subjects');

                    var errors = [];

                    let thisSubject = {
                        SubjectName: req.body['input-subjectname']
                    };
                    
                    if(!Subject.SubjectName.IsValidName(thisSubject.SubjectName))
                        errors.push(`Tên bộ đề phải từ ${Subject.SubjectName.MIN} đến ${Subject.SubjectName.MAX} ký tự`);

                    if(errors.length <= 0) {
                        QueryNow(`UPDATE subjects SET SubjectName = ? WHERE SubjectID = ?`, [thisSubject.SubjectName, id])
                        .then((rows) => {
                            return Render_EditPage(id, res, req, { status: 'success' });
                        }).catch((error) => {
                            Log(error);
                            return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #1'] });
                        })
                    } else {
                        return Render_EditPage(id, res, req, { status: 'error', errors: errors });
                    }
                })
                .catch((error) => {
                    Log(error);
                    return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #2'] });
                })
    
                break;
            case 'delete':
                if(!id) return res.redirect('/dashboard/subjects');

                QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID WHERE s.SubjectID = ?${req.user.RoleType >= 2 ? '' : ` AND s.OwnerID = '${req.user.UserID}'`}`, [id])
                .then((rows) => {
                    if(rows.length <= 0)
                        return res.redirect('/dashboard/subjects');

                    var errors = [];

                    if(errors.length <= 0) {
                        var q = QueryNow(`DELETE FROM subjects WHERE SubjectID = ?`,[id]);

                        q.then((rows) => {
                            return res.redirect('/dashboard/subjects');
                        }).catch((error) => {
                            Log(error);
                            return Render_DeletePage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #1'] });
                        })
                    } else {
                        return Render_DeletePage(id, res, req, { status: 'error', errors: errors });
                    }
                })
                .catch((error) => {
                    Log(error);
                    return Render_DeletePage(id, res, req, { status: 'error', errors: ['Không thể xóa do lỗi truy vấn #2'] });
                })

                break;
        }
    }

    function Render_AddPage(id, res, req, extra={}) {
        res.render('dashboard/subjects/add', {
            page: 'subjects',
            head_title: `Thêm bộ đề - ${config.APP_NAME}`,
            user: req.user,
            ...extra
        });
    }

    function Render_EditPage(id, res, req, extra={}) {
        if(!id) return res.redirect('/dashboard/subjects');

        QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID WHERE s.SubjectID = ?${req.user.RoleType >= 2 ? '' : ` AND s.OwnerID = '${req.user.UserID}'`}`, [id])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/dashboard/subjects');

            res.render('dashboard/subjects/edit', {
                page: 'subjects',
                head_title: `Chỉnh sửa bộ đề - ${config.APP_NAME}`,
                user: req.user,
                editSubject: rows[0],
                ...extra
            });
        })
        .catch((error) => {
            Log(error);
            ErrorHandler(res, 'Oops... Something went wrong...');
        })
    }

    function Render_DeletePage(id, res, req, extra={}) {
        if(!id) return res.redirect('/dashboard/subjects');

        QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID WHERE s.SubjectID = ?${req.user.RoleType >= 2 ? '' : ` AND s.OwnerID = '${req.user.UserID}'`}`, [id])
        .then((rows) => {
            if(rows.length <= 0)
                return res.redirect('/dashboard/subjects');

            res.render('dashboard/subjects/delete', {
                page: 'subjects',
                head_title: `Xóa bộ đề - ${config.APP_NAME}`,
                user: req.user,
                editSubject: rows[0],
                ...extra
            });
        })
        .catch((error) => {
            Log(error);
            ErrorHandler(res, 'Oops... Something went wrong...');
        })
    }
}

function ErrorHandler(res, msg) {
    res.render('error', { errorMessage: msg });
}