const config = require('./../../config');
const { Log, ErrorHandler } = require('../utils/logger');
const { QueryNow, GetPageLimit } = require('../database');
const activeTest = require('./../activeTest');

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
                case 'open':
                    if(!id) return res.redirect('/dashboard/tests');

                    QueryNow(`SELECT t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 0)
                            return res.redirect('/dashboard/tests');

                        return QueryNow(`UPDATE tests SET OpenStatus = 1 WHERE TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
                    })
                    .then((rows) => {
                        return res.redirect('/dashboard/tests');
                    })
                    .catch((rows) => {
                        if(!id) return res.redirect('/dashboard/tests');
                    })

                    break;
                case 'start':
                    if(!id) return res.redirect('/dashboard/tests');

                    QueryNow(`SELECT t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 1)
                            return res.redirect('/dashboard/tests');

                        return activeTest.StartTest(id);
                    })
                    .then((status) => {
                        return res.redirect('/dashboard/tests');
                    })
                    .catch((error) => {
                        return res.redirect('/dashboard/tests');
                    })

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
                        return res.json({ status: true, parts: data });
                    }).catch((error) => {
                        return res.json({ status: false, errors: ['Something went wrong with our server'] });
                    });

                    break;
                case 'add':
                    var test = req.body.test;
                    var errors = CheckValidTest(test);

                    if(errors.length > 0)
                        return res.json({ status: false, errors: errors });

                    var testData = [];
                    GenerateTestData(test)
                    .then((data) => {
                        testData = data;
                        return QueryNow(`SELECT PINCode FROM tests WHERE OpenStatus <= 2`);
                    })
                    .then((rows) => {
                        var listPIN = [];
                        for(let p of rows) listPIN.push(p.PINCode);

                        if(test.PIN.length > 0 && listPIN.indexOf(test.PIN) != -1)
                            return res.json({ status: false, errors: ['Vui lòng chọn mã PIN khác hoặc để trống'] });
                        while(test.PIN.length <= 0 || listPIN.indexOf(test.PIN) != -1)
                            test.PIN = String(getRandomInt(10000, 99999));

                        var totalQuest = 0;
                        for(let p of testData)
                            totalQuest += p.QUESTS.length;

                        return QueryNow(`INSERT INTO tests (PINCode, TestName, TestTime, QuestTotal, OpenStatus, OwnerID) VALUES(?,?,?,?,0,?)`, [test.PIN, test.NAME, test.TIME, totalQuest, req.user.UserID]);
                    })
                    .then((rows) => {
                        for(let p of testData) {
                            QueryNow(`INSERT INTO testparts (TestID, PartName) VALUES(?, ?)`, [rows.insertId, p.NAME])
                            .then((rows) => {
                                for(let q of p.QUESTS)
                                    QueryNow(`INSERT INTO partquests (TestPartID, QuestID) VALUES(?, ?)`, [rows.insertId, q.ID]);
                            });
                        }

                        return res.json({ status: true });
                    })
                    .catch((error) => {
                        return res.json({ status: false, errors: ['Something went wrong with our server'] });
                    });

                    break;
                case 'edit':
                    if(!id) return res.redirect('/dashboard/tests');

                    var errors = [];
                    var t = [];

                    QueryNow(`SELECT t.TestID, t.PINCode, t.TestName, t.TestTime, t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/tests');

                        t = {
                            ID: id,
                            NAME: req.body['input-testname'],
                            TIME: Number(req.body['input-testtime']),
                            PIN: req.body['input-pincode'],
                        }

                        if(Number(rows[0]['OpenStatus']) > 0)
                            errors.push("Bài kiểm tra này đang hoạt động, không thể chỉnh sửa");
                        if(t.NAME.length <= 0 || t.NAME.length > 128)
                            errors.push("Tên bài kiểm tra phải từ 1 đến 128 ký tự");
                        if(t.TIME <= 5 || t.TIME > 1000)
                            errors.push("Thời gian kiểm tra phải từ 5 đến 1000 phút");
                        if(t.PIN.length > 0 && !(new RegExp(/^\d{5}$/).test(t.PIN)))
                            errors.push("Mã PIN phải là 5 chữ số (hoặc để trống)");

                        if(errors.length > 0)
                            Render_EditPage(id, res, req, { status: 'error', errors: errors });

                        return QueryNow(`SELECT PINCode FROM tests WHERE OpenStatus <= 2 AND TestID != ?`, [id]);
                    })
                    .then((rows) => {
                        var listPIN = [];
                        for(let p of rows) listPIN.push(p.PINCode);

                        if(t.PIN.length > 0 && listPIN.indexOf(t.PIN) != -1)
                            errors.push('Vui lòng chọn mã PIN khác hoặc để trống');
                        while(t.PIN.length <= 0 || listPIN.indexOf(t.PIN) != -1)
                            t.PIN = String(getRandomInt(10000, 99999));

                        if(errors.length > 0)
                            return Render_EditPage(id, res, req, { status: 'error', errors: errors });

                        QueryNow(`UPDATE tests SET TestName = ?, PINCode = ?, TestTime = ? WHERE TestID = ?`, [t.NAME, t.PIN, t.TIME, id])
                        .then((rows) => { 
                            return Render_EditPage(id, res, req, { status: 'success' });
                        }).catch((error) => {
                            Log(error);
                            return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #1'] });
                        })
                    })
                    .catch((error) => {
                        Log(error);
                        return Render_EditPage(id, res, req, { status: 'error', errors: ['Không thể cập nhật do lỗi truy vấn #2'] });
                    })
        
                    break;
                case 'delete':
                    if(!id) return res.redirect('/dashboard/tests');

                    var errors = [];
                    var t = [];

                    QueryNow(`SELECT t.TestID, t.PINCode, t.TestName, t.TestTime, t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/tests');

                        if(Number(rows[0]['OpenStatus']) > 0)
                            errors.push("Bài kiểm tra này đang hoạt động, không thể xóa");

                        if(errors.length <= 0) {
                            QueryNow(`DELETE FROM tests WHERE TestID = ?`,[id])
                            .then((rows) => { return QueryNow(`SELECT TestPartID FROM testparts WHERE TestID = ?`, [id]) }) // Scan all parts of this test
                            .then((rows) => { 
                                QueryNow(`DELETE FROM testparts WHERE TestID = ?`, [id]);
                                for(let p of rows) 
                                    QueryNow(`DELETE FROM partquests WHERE TestPartID = ?`, [p.TestPartID]);

                                return res.redirect('/dashboard/tests');
                            })
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

        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
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
                        if(p.NAME.length > 0)
                            testParts.push({
                                NAME: p.NAME,
                                QUESTS: ScanQuestsIntoPart(p.TAGS, questList),
                                COUNT: p.COUNT
                            })
                    }

                    // Refresh the part
                    for(let tp of testParts) {
                        ShuffleArray(tp.QUESTS);
                        while(tp.QUESTS.length > tp.COUNT)
                            tp.QUESTS.pop();
                    }

                    resolve(testParts);
                })
                .catch((error) => {
                    reject(error);
                });
            });
        }

        function ShuffleArray(a) { // Thanks to https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
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
                    page: 'tests',
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
            if(!id) return res.redirect('/dashboard/tests');

            QueryNow(`SELECT t.TestID, t.PINCode, t.TestName, t.TestTime, t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
            .then((rows) => {
                if(rows.length <= 0 || Number(rows[0]['OpenStatus']) > 0)
                    return res.redirect('/dashboard/tests');
  
                res.render('dashboard/tests/edit', {
                    page: 'tests',
                    head_title: `Chỉnh sửa bài kiểm tra - ${config.APP_NAME}`,
                    user: req.user,
                    editTest: rows[0],
                    ...extra
                });
            })
            .catch((error) => {
                Log(error);
                ErrorHandler(res, 'Oops... Something went wrong...');
            })
        }

        function Render_DeletePage(id, res, req, extra={}) {
            if(!id) return res.redirect('/dashboard/tests');

            QueryNow(`SELECT t.TestID, t.PINCode, t.TestName, t.TestTime, t.OpenStatus FROM tests t WHERE t.TestID = ?${req.user.RoleType >= 2 ? '' : ` AND t.OwnerID = '${req.user.UserID}'`}`, [id])
            .then((rows) => {
                if(rows.length <= 0 || Number(rows[0]['OpenStatus']) > 0)
                    return res.redirect('/dashboard/tests');
  
                res.render('dashboard/tests/delete', {
                    page: 'tests',
                    head_title: `Xóa bài kiểm tra - ${config.APP_NAME}`,
                    user: req.user,
                    editTest: rows[0],
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