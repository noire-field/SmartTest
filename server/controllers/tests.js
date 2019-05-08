const config = require('./../../config');
const { Log, ErrorHandler } = require('../utils/logger');
const { QueryNow, GetPageLimit } = require('../database');

module.exports = {
    Controller_Tests: function(type, action, id, req, res, next) {
        if(req.user.RoleType < 1)
            return res.redirect('/dashboard');

        if(type == 0) { // GET
            switch(action)
            {
                case null:
                case undefined: // View list
                    var page = req.query.page ? req.query.page : 1;
                    var pagination = [page, 1];
        
                    QueryNow(`SELECT COUNT(TestID) AS TOTAL FROM tests${req.user.RoleType >= 2 ? `` : ` WHERE OwnerID = '${req.user.UserID}'`}`)
                    .then((rows) => {
                        var { START, LIMIT } = GetPageLimit(page, rows[0].TOTAL, config.ITEM_PER_PAGE);
                        pagination = [page, Math.ceil(rows[0].TOTAL / config.ITEM_PER_PAGE)];

                        return QueryNow(`SELECT t.*, u.FirstName, u.LastName FROM tests t INNER JOIN users u ON t.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE t.OwnerID = '${req.user.UserID}'`} LIMIT ${START}, ${LIMIT}`);
                    })
                    .then((rows) => {
                        res.render('dashboard/tests/index', {
                            page: 'tests',
                            head_title: `Quản lý bài kiểm tra - ${config.APP_NAME}`,
                            user: req.user,
                            testList: rows,
                            pagination: { 
                                URL: '/dashboard/tests?page=',
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
                case 'preview': 
                    var test = req.body.test;
                    var errors = CheckValidTest(test);

                    if(errors.length > 0)
                        return res.json({ status: false, errors: errors });

                    var testData = GenerateTestData(test);
                    testData.then((data) => {
                        console.log(data);
                        return res.json({ status: true, data: data });
                    }).catch((error) => {
                        return res.json({ status: false, errors: ['Something went wrong with our server'] });
                    });
                    
                    break;
                case 'add':
                   

                    /*
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
                    }*/

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

        function CheckValidTest(t) {
            var errors = [];
            try {
                if(t.NAME.length <= 0 || t.NAME.length > 128)
                    errors.push("Tên bài kiểm tra phải từ 1 đến 128 ký tự");
                if(t.SUBJECTID <= 0)
                    errors.push("Vui lòng chọn bộ đề");
                if(t.TIME <= 5 || t.TIME > 1000)
                    errors.push("Thời gian kiểm tra phải từ 5 đến 1000 phút");
                if(t.PIN.length > 0 && !(new RegExp(/^\d{5}$/).test(t.PIN)))
                    errors.push("Mã PIN phải là 5 chữ số (hoặc để trống)");
                var fixedParts = [];
                for(var p of t.PARTS) {
                    if(p.NAME.length > 0)
                    {
                        if(p.TAGS.length <= 0) { errors.push("Phần '"+ p.NAME +"' chưa có thẻ"); break; }
                        if(p.NAME.length > 64) { errors.push("Phần '"+ p.NAME +"' tên quá dài, vui lòng giảm xuống tối đa 64 ký tự"); break; }
                        if(p.TAGS.length > 64) { errors.push("Phần '"+ p.NAME +"' có quá nhiều thẻ"); break; }
                        if(Number(p.COUNT) <= 0) {errors.push("Phần '"+ p.NAME +"' chưa có số câu hỏi mong muốn"); break; }

                        fixedParts.push(p);
                    }
                }

                if(fixedParts.length <= 0)
                    errors.push("Bạn chưa thêm bất kỳ phần nào và thẻ");
            } catch(e) {
                errors.push('Lỗi không xác định');
            }

            return errors;
        }

        async function GenerateTestData(test) {
            // Pull out all questions of this subject
            return new Promise((resolve, reject) => {
                QueryNow(`SELECT q.QuestID, q.QuestContent, GROUP_CONCAT(qt.Tag SEPARATOR ',') Tags FROM questions q INNER JOIN questtags qt ON q.QuestID = qt.QuestID WHERE q.SubjectID = ? GROUP BY q.QuestID`, [test.SUBJECTID])
                .then((rows) => {
                    var testParts = [];
                    var questList = [];

                    for(let t of rows) {
                        questList.push({
                            ID: t.QuestID,
                            CONTENT: t.QuestContent,
                            TAGS: TagStringToArray(t.Tags)
                        });
                    }

                    for(let p of test.PARTS) {
                        testParts.push({
                            NAME: p.NAME,
                            QUESTS: ScanQuestsIntoPart(p.TAGS, questList)
                        })
                    }

                    resolve(testParts);
                })
                .catch((error) => {
                    reject(error);
                });
            });
        }

        function ScanQuestsIntoPart(tags, questList) {
            var reqTags = TagStringToArray(tags);
            var newList = [];

            for(let q of questList) {
                let allowed = true;
                for(let t of q.TAGS) {
                    if(reqTags.indexOf(t) == -1)
                        allowed = false;
                }
                if(allowed) newList.push(q);
            }

            return newList;
        }

        function TagStringToArray(strTags) {
            return strTags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0 ? true : false);
        }

        function Render_AddPage(id, res, req, extra={}) {
            // Find subjects first
            QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`}`)
            .then((rows) => {
                res.render('dashboard/tests/add', {
                    page: 'quests',
                    head_title: `Thêm bài kiểm tra - ${config.APP_NAME}`,
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