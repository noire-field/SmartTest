const config = require('./../../config');
const { Log, ErrorHandler } = require('../utils/logger');
const { QueryNow, GetPageLimit } = require('../database');
const activeGames = require('./../activeGames');
var json2csv = require('json2csv');

module.exports = {
    Controller_Games: function(type, action, id, req, res, next) {
        if(req.user.RoleType < 1)
            return res.redirect('/dashboard');

        if(type == 0) { // GET
            switch(action)
            {
                case null:
                case undefined: // View list
                    var page = req.query.page ? req.query.page : 1;
                    var pagination = [page, 1];
        
                    QueryNow(`SELECT COUNT(GameID) AS TOTAL FROM games${req.user.RoleType >= 2 ? `` : ` WHERE OwnerID = '${req.user.UserID}'`}`)
                    .then((rows) => {
                        var { START, LIMIT } = GetPageLimit(page, rows[0].TOTAL, config.ITEM_PER_PAGE);
                        pagination = [page, Math.ceil(rows[0].TOTAL / config.ITEM_PER_PAGE)];

                        return QueryNow(`SELECT g.*, s.SubjectName, u.FirstName, u.LastName FROM games g INNER JOIN users u ON g.OwnerID = u.UserID INNER JOIN subjects s ON g.SubjectID = s.SubjectID${req.user.RoleType >= 2 ? `` : ` WHERE g.OwnerID = '${req.user.UserID}'`} LIMIT ${START}, ${LIMIT}`);
                    })
                    .then((rows) => {
                        res.render('dashboard/games/index', {
                            page: 'games',
                            head_title: `Quản lý trò chơi - ${config.APP_NAME}`,
                            user: req.user,
                            gameList: rows,
                            pagination: { 
                                URL: '/dashboard/games?page=',
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
                    if(!id) return res.redirect('/dashboard/games');

                    QueryNow(`SELECT OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 0)
                            return res.redirect('/dashboard/games');

                        return activeGames.OpenRoom(id);
                    })
                    .then((rows) => {
                        return res.redirect('/dashboard/games');
                    })
                    .catch((rows) => {
                        if(!id) return res.redirect('/dashboard/games');
                    })

                    break;
                case 'viewmarks':
                    if(!id) return res.redirect('/dashboard/games');

                    QueryNow(`SELECT OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 3)
                            res.redirect('/dashboard/games');
                        else return QueryNow(`SELECT * FROM games_marks WHERE GameID = ? ORDER BY Ranking DESC`, [id]);
                    })
                    .then((rows) => {
                        return res.render('dashboard/games/viewmarks', {
                            page: 'tests',
                            head_title: `Xem điểm số - ${config.APP_NAME}`,
                            user: req.user,
                            gameId: id,
                            isAvailable: rows.length > 0 ? true : false,
                            markList: rows
                        });
                    })
                    .catch((rows) => {
                        if(!id) return res.redirect('/dashboard/games');
                    })

                    break;
                //case 'download':
             
                default:
                    res.render('error', { errorMessage: 'Trang này không tồn tại.' });
                    break;
            }
        } else { // POST
            switch(action)
            {
                case 'preview': 
                    var game = req.body.game;
                    var errors = CheckValidTest(game);

                    if(errors.length > 0)
                        return res.json({ status: false, errors: errors });

                    var gameData = GenerateGameData(game);
                    gameData.then((data) => {
                        return res.json({ status: true, quests: data });
                    }).catch((error) => {
                        console.log(error);
                        return res.json({ status: false, errors: ['Something went wrong with our server'] });
                    });

                    break;
                case 'add':
                    var game = req.body.game;
                    var errors = CheckValidTest(game);

                    if(errors.length > 0)
                        return res.json({ status: false, errors: errors });

                    GenerateGameData(game)
                    .then((data) => {
                        if(data.length <= 0) // No quests
                            return res.json({ status: false, errors: ['Không tìm thấy câu hỏi nào'] });

                        return QueryNow(`SELECT PINCode FROM games WHERE OpenStatus <= 2`);
                    })
                    .then((rows) => {
                        var listPIN = [];
                        for(let p of rows) listPIN.push(p.PINCode);

                        if(game.PIN.length > 0 && listPIN.indexOf(game.PIN) != -1)
                            return res.json({ status: false, errors: ['Vui lòng chọn mã PIN khác hoặc để trống'] });
                        while(game.PIN.length <= 0 || listPIN.indexOf(game.PIN) != -1)
                            game.PIN = String(getRandomInt(10000, 99999));

                        return QueryNow(`INSERT INTO games (PINCode, GameName, SubjectID, TimePerQuest, CreatedDate, OpenStatus, OwnerID) VALUES(?,?,?,?,NOW(),0,?)`, [game.PIN, game.NAME, game.SUBJECTID, game.QUESTTIME, req.user.UserID]);
                    })
                    .then((rows) => {
                        return res.json({ status: true });
                    })
                    .catch((error) => {
                        return res.json({ status: false, errors: ['Something went wrong with our server'] });
                    });

                    break;
                case 'edit':
                    if(!id) return res.redirect('/dashboard/games');

                    var errors = [];
                    var g = {
                        ID: id,
                        NAME: req.body['input-gamename'],
                        QUESTTIME: Number(req.body['input-questtime']),
                        SUBJECTID: Number(req.body['input-subjectid']),
                        PIN: req.body['input-pincode'],
                    }

                    GenerateGameData(g)
                    .then((data) => {
                        if(data.length <= 0) // No quests
                            return Render_EditPage(id, res, req, { status: 'error', errors: ['Không tìm thấy câu hỏi nào từ bộ đề vừa chọn'] });

                        return QueryNow(`SELECT GameID, PINCode, GameName, SubjectID, TimePerQuest, OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id])
                    })
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/games');

                        if(Number(rows[0]['OpenStatus']) > 0)
                            errors.push("Trò chơi này đang hoạt động, không thể chỉnh sửa");
                        if(g.NAME.length <= 0 || g.NAME.length > 128)
                            errors.push("Tên trò chơi phải từ 1 đến 128 ký tự");
                        if(g.QUESTTIME <= 5 || g.QUESTTIME > 1000)
                            errors.push("Thời gian trả lời mỗi câu phải từ 5 đến 10 giây");
                        if(g.PIN.length > 0 && !(new RegExp(/^\d{5}$/).test(g.PIN)))
                            errors.push("Mã PIN phải là 5 chữ số (hoặc để trống)");

                        if(errors.length > 0)
                            Render_EditPage(id, res, req, { status: 'error', errors: errors });

                        return QueryNow(`SELECT PINCode FROM games WHERE OpenStatus <= 2 AND GameID != ?`, [id]);
                    })
                    .then((rows) => {
                        var listPIN = [];
                        for(let p of rows) listPIN.push(p.PINCode);

                        if(g.PIN.length > 0 && listPIN.indexOf(g.PIN) != -1)
                            errors.push('Vui lòng chọn mã PIN khác hoặc để trống');
                        while(g.PIN.length <= 0 || listPIN.indexOf(g.PIN) != -1)
                            g.PIN = String(getRandomInt(10000, 99999));

                        if(errors.length > 0)
                            return Render_EditPage(id, res, req, { status: 'error', errors: errors });

                        QueryNow(`UPDATE games SET GameName = ?, PINCode = ?, SubjectID = ?, TimePerQuest = ? WHERE GameID = ?`, [g.NAME, g.PIN, g.SUBJECTID, g.QUESTTIME, id])
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
                    if(!id) return res.redirect('/dashboard/games');

                    var errors = [];
                    var t = [];

                    QueryNow(`SELECT GameID, PINCode, GameName, SubjectID, TimePerQuest, OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id])
                    .then((rows) => {
                        if(rows.length <= 0)
                            return res.redirect('/dashboard/games');

                        if(Number(rows[0]['OpenStatus']) > 0)
                            errors.push("Trò chơi này đang hoạt động, không thể xóa");

                        if(errors.length <= 0) {
                            QueryNow(`DELETE FROM games WHERE GameID = ?`,[id])
                            .then((rows) => {
                                return res.redirect('/dashboard/games');
                            })
                            .catch((error) => {
                                Log(error);
                                return Render_DeletePage(id, res, req, { status: 'error', errors: ['Không thể xóa do lỗi truy vấn #1'] });
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
                if(t.QUESTTIME <= 5 || t.QUESTTIME > 1000)
                    errors.push("Thời gian kiểm tra phải từ 5 đến 1000 phút");
                if(t.PIN.length > 0 && !(new RegExp(/^\d{5}$/).test(t.PIN)))
                    errors.push("Mã PIN phải là 5 chữ số (hoặc để trống)");
            } catch(e) {
                errors.push('Lỗi không xác định');
            }

            return errors;
        }

        async function GenerateGameData(game) {
            return new Promise((resolve, reject) => {
                QueryNow(`SELECT QuestID, QuestContent FROM questions WHERE SubjectID = ?`, [game.SUBJECTID])
                .then((rows) => {
                    var questList = [];
                    for(let t of rows) {
                        questList.push({
                            ID: t.QuestID,
                            CONTENT: t.QuestContent
                        });
                    }

                    resolve(questList);
                })
                .catch((error) => {
                    reject(error);
                });
            });
        }

        function Render_AddPage(id, res, req, extra={}) {
            // Find subjects first
            QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`}`)
            .then((rows) => {
                res.render('dashboard/games/add', {
                    page: 'games',
                    head_title: `Tạo trò chơi - ${config.APP_NAME}`,
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
            if(!id) return res.redirect('/dashboard/games');

            var subjectList = [];

            QueryNow(`SELECT s.SubjectID, s.SubjectName, u.FirstName, u.LastName FROM subjects s INNER JOIN users u ON s.OwnerID = u.UserID${req.user.RoleType >= 2 ? `` : ` WHERE s.OwnerID = '${req.user.UserID}'`}`)
            .then((rows) => {
                subjectList = rows;
                return QueryNow(`SELECT GameID, PINCode, GameName, SubjectID, TimePerQuest, OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id]);
            })
            .then((rows) => {
                if(rows.length <= 0 || Number(rows[0]['OpenStatus']) > 0)
                    return res.redirect('/dashboard/games');
  
                res.render('dashboard/games/edit', {
                    page: 'games',
                    head_title: `Chỉnh sửa trò chơi - ${config.APP_NAME}`,
                    user: req.user,
                    subjectList,
                    editGame: rows[0],
                    ...extra
                });
            })
            .catch((error) => {
                Log(error);
                ErrorHandler(res, 'Oops... Something went wrong...');
            })
        }

        function Render_DeletePage(id, res, req, extra={}) {
            if(!id) return res.redirect('/dashboard/games');

            QueryNow(`SELECT GameID, PINCode, GameName, SubjectID, TimePerQuest, OpenStatus FROM games WHERE GameID = ?${req.user.RoleType >= 2 ? '' : ` AND OwnerID = '${req.user.UserID}'`}`, [id])
            .then((rows) => {
                if(rows.length <= 0 || Number(rows[0]['OpenStatus']) > 0)
                    return res.redirect('/dashboard/games');
  
                res.render('dashboard/games/delete', {
                    page: 'games',
                    head_title: `Xóa trò chơi - ${config.APP_NAME}`,
                    user: req.user,
                    editGame: rows[0],
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