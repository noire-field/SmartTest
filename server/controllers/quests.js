const config = require('./../../config');
const { Log, ErrorHandler } = require('../utils/logger');
const { QueryNow, GetPageLimit } = require('../database');

module.exports = {
    Controller_Quests: function(type, action, id, req, res, next) {
        if(req.user.RoleType < 1)
            return res.redirect('/dashboard');

        if(type == 0) { // GET
            switch(action)
            {
                case null:
                case undefined: // View list
                    var page = req.query.page ? req.query.page : 1;
                    var pagination = [page, 1];
        
                    QueryNow(`SELECT COUNT(QuestID) AS TOTAL FROM questions${req.user.RoleType >= 2 ? `` : ` WHERE OwnerID = '${req.user.UserID}'`}`)
                    .then((rows) => {
                        console.log(rows[0].TOTAL);
                        var { START, LIMIT } = GetPageLimit(page, rows[0].TOTAL, config.ITEM_PER_PAGE);
                        pagination = [page, Math.ceil(rows[0].TOTAL / config.ITEM_PER_PAGE)];

                        return QueryNow(`SELECT q.QuestID, q.QuestContent, s.SubjectName, u.FirstName, u.LastName FROM questions q INNER JOIN subjects s ON q.SubjectID = s.SubjectID INNER JOIN users u ON q.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`} LIMIT ${START}, ${LIMIT}`);
                    })
                    .then((rows) => {
                        res.render('dashboard/quests/index', {
                            page: 'quests',
                            head_title: `Quản lý câu hỏi - ${config.APP_NAME}`,
                            user: req.user,
                            questList: rows,
                            pagination: { 
                                URL: '/dashboard/quests?page=',
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

                    let quest = {
                        SubjectID: req.body['input-subjectid'] != undefined ? req.body['input-subjectid'] : 0,
                        Content: req.body['input-questcontent'],
                        Tags: [],
                        Answers: []
                    };

                    // Tags
                    var splitTags = req.body['input-questtags'].split(',');
                    for(tag of splitTags) {
                        var trimTag = tag.trim();
                        if(trimTag.length > 0)
                            quest.Tags.push(trimTag);
                    }

                    // Answers
                    for(let i = 0; i < 4; i++) {
                        if(req.body[`input-questans[${i}][content]`].length > 0) {
                            quest.Answers.push({ 
                                CONTENT: req.body[`input-questans[${i}][content]`],
                                CORRECT: req.body[`input-questans[${i}][correct]`] != undefined ? true : false
                            });
                        }
                    }

                    if(quest.SubjectID <= 0)
                        errors.push(`Bộ đề không hợp lệ, vui lòng chọn bộ đề`);
                    if(quest.Content.length <= 0 || quest.Content.length >= 128)
                        errors.push(`Nội dung câu hỏi phải từ 1 đến 128 ký tự`);
                    if(quest.Tags.length <= 0 || quest.Tags.length > 5)
                        errors.push(`Câu hỏi chưa có thẻ, vui lòng thêm thẻ, tối đa 5 thẻ`);
                    if(quest.Answers.length <= 0)
                        errors.push(`Chưa có câu trả lời nào được nhập vào`);
                    else {
                        let CorrectAnswer = false;
                        for(let i = 0; i < quest.Answers.length; i++) {
                            if(quest.Answers[i].CORRECT == true) {
                                CorrectAnswer = true;
                                break;
                            }
                        }

                        if(!CorrectAnswer)
                            errors.push(`Phải có ít nhất một câu hỏi đúng`);
                    }

                    if(errors.length <= 0) {
                        QueryNow(`INSERT INTO questions (SubjectID, QuestContent, OwnerID) VALUES(?, ?, ?)`, [quest.SubjectID, quest.Content, req.user.UserID])
                        .then((rows) => {
                            // Add questions
                            for(let q of quest.Answers)
                                QueryNow(`INSERT INTO answers (QuestID,AnsType,AnsContent,IsCorrect) VALUES(?,?,?,?)`, [rows.insertId, 0, q.CONTENT, q.CORRECT]);

                            // Add tags
                            for(let t of quest.Tags)
                                QueryNow(`INSERT INTO questtags (QuestID,Tag) VALUES(?,?)`, [rows.insertId, t]);

                            return res.redirect('/dashboard/quests');
                        })
                        .catch((error) => {
                            Log(error);
                            return Render_AddPage(id, res, req, { status: 'error', errors: ['Không thể thêm do lỗi truy vấn #1'] });
                        })
                    } else {
                        return Render_AddPage(id, res, req, { status: 'error', errors: errors });
                    }

                    break;
                case 'edit':
                    if(!id) return res.redirect('/dashboard/quests');

                    QueryNow(`SELECT q.QuestID, q.SubjectID, q.QuestContent FROM questions q WHERE q.QuestID = ?${req.user.RoleType >= 2 ? '' : ` AND q.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/quests');

                        var errors = [];

                        let quest = {
                            SubjectID: req.body['input-subjectid'] != undefined ? req.body['input-subjectid'] : 0,
                            Content: req.body['input-questcontent'],
                            Tags: [],
                            Answers: []
                        };
        
                        // Tags
                        var splitTags = req.body['input-questtags'].split(',');
                        for(tag of splitTags) {
                            var trimTag = tag.trim();
                            if(trimTag.length > 0)
                                quest.Tags.push(trimTag);
                        }
        
                        // Answers
                        for(let i = 0; i < 4; i++) {
                            if(req.body[`input-questans[${i}][content]`].length > 0) {
                                quest.Answers.push({ 
                                    CONTENT: req.body[`input-questans[${i}][content]`],
                                    CORRECT: req.body[`input-questans[${i}][correct]`] != undefined ? true : false
                                });
                            }
                        }
        
                        if(quest.SubjectID <= 0)
                            errors.push(`Bộ đề không hợp lệ, vui lòng chọn bộ đề`);
                        if(quest.Content.length <= 0 || quest.Content.length >= 128)
                            errors.push(`Nội dung câu hỏi phải từ 1 đến 128 ký tự`);
                        if(quest.Tags.length <= 0 || quest.Tags.length > 5)
                            errors.push(`Câu hỏi chưa có thẻ, vui lòng thêm thẻ, tối đa 5 thẻ`);
                        if(quest.Answers.length <= 0)
                            errors.push(`Chưa có câu trả lời nào được nhập vào`);
                        else {
                            let CorrectAnswer = false;
                            for(let i = 0; i < quest.Answers.length; i++) {
                                if(quest.Answers[i].CORRECT == true) {
                                    CorrectAnswer = true;
                                    break;
                                }
                            }
        
                            if(!CorrectAnswer)
                                errors.push(`Phải có ít nhất một câu hỏi đúng`);
                        }

                        if(errors.length <= 0) {
                            QueryNow(`UPDATE questions SET SubjectID = ?, QuestContent = ? WHERE QuestID = ?`, [quest.SubjectID, quest.Content, id])
                            .then((rows) => { return QueryNow(`DELETE FROM answers WHERE QuestID = ?`, [id]) })
                            .then((rows) => { return QueryNow(`DELETE FROM questtags WHERE QuestID = ?`, [id]) })
                            .then((rows) => {
                                for(let q of quest.Answers)
                                    QueryNow(`INSERT INTO answers (QuestID,AnsType,AnsContent,IsCorrect) VALUES(?,?,?,?)`, [id, 0, q.CONTENT, q.CORRECT]);
                                for(let t of quest.Tags)
                                    QueryNow(`INSERT INTO questtags (QuestID,Tag) VALUES(?,?)`, [id, t]);

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
                    if(!id) return res.redirect('/dashboard/quests');

                    QueryNow(`SELECT q.QuestID, q.QuestContent FROM questions q WHERE q.QuestID = ?${req.user.RoleType >= 2 ? '' : ` AND q.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/quests');

                        var errors = [];
                        if(errors.length <= 0) {
                            QueryNow(`DELETE FROM questions WHERE QuestID = ?`,[id])
                            .then((rows) => { return QueryNow(`DELETE FROM questtags WHERE QuestID = ?`, [id]) })
                            .then((rows) => { return QueryNow(`DELETE FROM answers WHERE QuestID = ?`, [id]) })
                            .then((rows) => { return res.redirect('/dashboard/quests') })
                            .catch((error) => {
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
            // Find subjects first
            QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`}`)
            .then((rows) => {
                res.render('dashboard/quests/add', {
                    page: 'quests',
                    head_title: `Thêm câu hỏi - ${config.APP_NAME}`,
                    user: req.user,
                    subjectList: rows,
                    ...extra
                });
            })
            .catch((error) => {
                Log(error);
                ErrorHandler(res, 'Oops... Something went wrong...');
            })
        }

        function Render_EditPage(id, res, req, extra={}) {
            if(!id) return res.redirect('/dashboard/quests');

            var questInfo = null;
            var subjectList = [];
            var questTags = [];

            QueryNow(`SELECT q.QuestID, q.SubjectID, q.QuestContent FROM questions q WHERE q.QuestID = ?${req.user.RoleType >= 2 ? '' : ` AND q.OwnerID = '${req.user.UserID}'`}`, [id])
            .then((rows) => {
                if(rows.length <= 0)
                    return res.redirect('/dashboard/quests');
                
                questInfo = rows[0];
                return QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`}`)
            })
            .then((rows) => {
                subjectList = rows;
                return QueryNow(`SELECT Tag FROM questtags WHERE QuestID = ?`, [id]);
            })
            .then((rows) => {
                questTags = rows;
                return QueryNow(`SELECT * FROM answers WHERE QuestID = ?`, [id]);
            })
            .then((rows) => {
                var missingLenth = Math.min(4-rows.length, 4);
                for(let i = 0; i < missingLenth; i++)
                    rows.push({ AnsContent: '', IsCorrect: false });

                for(let i = 0; i < 4; i++) {
                    if(typeof rows[i].IsCorrect == 'object') 
                        rows[i].IsCorrect = JSON.parse(JSON.stringify(rows[i].IsCorrect)).data[0]
                    rows[i].Index = i;
                }
            
                res.render('dashboard/quests/edit', {
                    page: 'quests',
                    head_title: `Chỉnh sửa câu hỏi - ${config.APP_NAME}`,
                    user: req.user,
                    subjectList,
                    questTags: questTags.map((o) => o.Tag).join(', '),
                    editQuest: questInfo,
                    answers: rows,
                    ...extra
                });
            })
            .catch((error) => {
                Log(error);
                ErrorHandler(res, 'Oops... Something went wrong...');
            })
        }

        function Render_DeletePage(id, res, req, extra={}) {
            if(!id) return res.redirect('/dashboard/quests');

            QueryNow(`SELECT q.QuestID, q.QuestContent FROM questions q WHERE q.QuestID = ?${req.user.RoleType >= 2 ? '' : ` AND q.OwnerID = '${req.user.UserID}'`}`, [id])
            .then((rows) => {
                if(rows.length <= 0)
                    return res.redirect('/dashboard/quests');

                res.render('dashboard/quests/delete', {
                    page: 'quests',
                    head_title: `Xóa câu hỏi - ${config.APP_NAME}`,
                    user: req.user,
                    editQuest: rows[0],
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