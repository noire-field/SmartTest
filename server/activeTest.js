const config = require('./../config');
const { Log } = require('./utils/logger');
const { QueryNow } = require('./database');

module.exports = {
    CheckStartup,
    StartTest,
    OpenTest,
    ActivateSocket
};

var RunningTests = [];

function CheckStartup() {
    QueryNow(`SELECT * FROM tests WHERE OpenStatus = 1 OR OpenStatus = 2`)
    .then((tests) => {
        if(tests.length <= 0) return;

        var thisTest = null;
        for(let t of tests) {
            thisTest = {
                ID: t.TestID,
                NAME: t.TestName,
                PIN: t.PINCode,
                STARTTIME: t.OpenStatus <= 1 ? null : new Date(t.StartTime),
                TESTTIME: Number(t.TestTime),
                STATUS: Number(t.OpenStatus),
                PARTS: [],
                STUDENTS: []
            };

            if(thisTest.STATUS == 2) { // Testing 
                Get_TestParts(thisTest.ID)
                .then((result) => {
                    if(result.status) {
                        thisTest.PARTS = result.parts;
                        RunningTests[thisTest.ID] = thisTest;
                    }
                });
            } else {
                RunningTests[thisTest.ID] = thisTest;
            }
        }
    });
}

function OpenTest(testId) {
    return new Promise((resolve, reject) => {
        var thisTest = null;

        QueryNow(`SELECT * FROM tests WHERE TestID = ?`, [testId])
        .then((rows) => {
            if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 0)
                return resolve({ status: false, message: 'Không thể tìm thấy bài kiểm tra này hoặc bài kiểm tra này đã mở.' });

            thisTest = {
                ID: rows[0].TestID,
                NAME: rows[0].TestName,
                PIN: rows[0].PINCode,
                STARTTIME: null,
                TESTTIME: Number(rows[0].TestTime),
                STATUS: 1,
                PARTS: [],
                STUDENTS: []
            };

            return QueryNow(`UPDATE tests SET OpenStatus = 1 WHERE TestID = ?`, [testId])
        })
        .then((rows) => {
            RunningTests[thisTest.ID] = thisTest;
            resolve({ status: true });
        })
        .catch((error) => {
            return resolve({ status: false, message: 'Có gì đó đã xảy ra ở phía máy chủ' });
        })
    });
}

function StartTest(testId) {
    return new Promise((outResolve, reject) => {
        var thisTest = RunningTests[testId];

        if(!thisTest)
            return QueryNow(`SELECT OpenStatus FROM tests WHERE TestID = ?`, [testId])
                    .then((rows) => {
                        if(rows.length <= 0) 
                            return outResolve({ status: false, message: 'Hệ thống không tồn tại bài kiểm tra này' });
                        if(Number(rows[0]['OpenStatus']) == 1) {
                            QueryNow(`UPDATE tests SET OpenStatus = 0 WHERE TestID = ?`, [testId])
                            .then((rows) => { return outResolve({ status: false, message: 'Vui lòng thử lại' }); });
                        } else  return outResolve({ status: false, message: 'Có lỗi không xác định' });
                    });

        Get_TestParts(testId)
        .then((result) => {
            if(result.status) {
                thisTest.STARTTIME = new Date();
                thisTest.PARTS = result.parts;
                
                QueryNow(`UPDATE tests SET OpenStatus = 2, StartTime = NOW() WHERE TestID = ?`, [testId]);
                return outResolve({ status: true });
            }

            return outResolve({ status: false, message: result.message });
        })
        .catch((error) => {
            console.log(error);
        });
    });
}

function Get_TestParts(testId) {
    return new Promise((outResolve, outReject) => {
        QueryNow(`SELECT TestPartID, PartName FROM testparts WHERE TestID = ?`, [testId])
        .then((parts) => {
            if(parts.length <= 0)
                return outResolve({ status: false, message: 'Bài kiểm tra này không có phần nào' });
    
            var strPartList = parts.map((p) => p.TestPartID).join(',');
            var allQuests = [];
            var allAnswers = [];
            var finalizedParts = [];
    
            return QueryNow(`SELECT pq.PartQuestID, pq.TestPartID, pq.QuestID, q.QuestContent FROM partquests pq INNER JOIN questions q on pq.QuestID = q.QuestID where pq.TestPartID IN (${strPartList})`)
            .then((quests) => {
                allQuests = quests;
    
                var strQuestList = quests.map((q) => q.QuestID).join(',');
                return QueryNow(`SELECT AnsID, QuestID, AnsContent, IsCorrect FROM answers WHERE QuestID IN (${strQuestList})`);
            })
            .then((answers) => {
                allAnswers = answers;
    
                for(let p of parts) {
                    var thisPart = {
                        NAME: p.PartName,
                        QUESTS: []
                    };
    
                    for(let q of allQuests) {
                        if(p.TestPartID == q.TestPartID) {
                            var thisQuest = {
                                CONTENT: q.QuestContent,
                                ANSWERS: []
                            }
    
                            for(let a of allAnswers) {
                                if(q.QuestID == a.QuestID) {
                                    thisQuest.ANSWERS.push({
                                        AnsID: a.AnsID,
                                        AnsContent: a.AnsContent,
                                        IsCorrect: JSON.parse(JSON.stringify(a.IsCorrect)).data[0] == 1 ? true : false
                                    });
                                }
                            }
    
                            thisPart.QUESTS.push(thisQuest);
                        }
                    }
    
                    finalizedParts.push(thisPart);
                }
    
                return outResolve({ status: true, parts: finalizedParts });
            })
            .catch((error) => {
                return outResolve({ status: false, message: "Có gì đó bị sai ở khâu lấy ra phần và câu hỏi" });
            });
        })
        .catch((error) => {
            console.log(error);
        })
    });
}

/*
setInterval(function() {
    console.log(RunningTests);
}, 1500);
*/

function ActivateSocket(io) {
    io.on('connection', (socket) => {
        console.log("New user connected");
    
        // Welcome
        socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat!'));
        socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined!'));

        socket.on('createMessage', (message) => {
            console.log('createMessage: ', message);
    
            io.emit('newMessage', generateMessage(message.from, message.text));
    
            socket.broadcast.emit('newMessage', {
                from: message.from,
                text: message.text,
                createdAt: new Date().getTime()
            });
        })
    
        socket.on('disconnect', () => {
            console.log("User disconnected");
        })
    });

    Log('Socket.IO Server has started alongside the HTTP Server');
}

function generateMessage(from, text) {
    return {
        from,
        text
    }
}