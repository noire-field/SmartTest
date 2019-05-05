const config = require('./../../config');
const { Log, ErrorHandler } = require('../utils/logger');
const { QueryNow, GetPageLimit } = require('../database');
const Subject = require('./../utils/subject');

module.exports = {
    Controller_Subjects: function(type, action, id, req, res, next) {
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
}