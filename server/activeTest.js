const socketIO = require('socket.io');

const config = require('./../config');
const { Log } = require('./utils/logger');
const { QueryNow } = require('./database');

module.exports = {
    CheckStartup,
    StartTest,
    OpenTest
};

var RunningTests = [];

function CheckStartup() {
    
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
                PARTS: [],
                STATUS: 1,
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
    return new Promise((resolve, reject) => {
        var thisTest = null;

        if(RunningTests[testId]) {
            console.log(RunningTests[testId]);
            resolve();
            return;
        } else {
            console.log('Cant find test');
            resolve();
            return;
        }

        // return QueryNow(`UPDATE tests SET OpenStatus = 2, StartTime = NOW() WHERE TestID = ?`, [testId]);

        QueryNow(`SELECT * FROM tests WHERE TestID = ?`, [testId])
        .then((rows) => {
            if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 1)
                return resolve({ status: false, message: 'Không thể tìm thấy bài kiểm tra này, hoặc bài kiểm tra này không ở trạng thái mở' });

            thisTest = {
                NAME: rows[0].TestName,
                PIN: rows[0].PINCode,
                STARTTIME: new Date(), // Temporarily
                TESTTIME: Number(rows[0].TestTime),
                PARTS: [],
                STATUS: 0
            };

            return QueryNow(`SELECT TestPartID, PartName FROM testparts WHERE TestID = ?`, [testId]);
        })
        .then((parts) => {
            if(parts.length <= 0)
                return resolve({ status: false, message: 'Bài kiểm tra này không có phần nào' });

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

                thisTest.PARTS = finalizedParts;
                return new Promise((resolve, reject) => resolve(true))
            });
        })
        .then((status) => {
            
        })
        .catch((error) => {
            console.log(error);
        });
    });
}


/* SOCKET.IO
io.on('connection', (socket) => {
    console.log("New user connected");

    // Welcome
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat!'));
    socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined!'));

    socket.on('createMessage', (message, callback) => {
        console.log('createMessage: ', message);

        io.emit('newMessage', generateMessage(message.from, message.text));
        callback('This is from the server');

        //socket.broadcast.emit('newMessage', {
        //    from: message.from,
        //    text: message.text,
        //    createdAt: new Date().getTime()
        //});
    })

    socket.on('disconnect', () => {
        console.log("User disconnected");
    })
});
*/