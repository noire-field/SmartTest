const config = require('./../config');
const { Log } = require('./utils/logger');
const { QueryNow } = require('./database');

module.exports = {
    CheckStartup,
    StartTest,
    OpenTest,
    ActivateSocket,
    JoinTest
};

var RunningTests = [];
var socketUsers = [];
var socketIO = null;

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

            if(thisTest.STATUS >= 1) { // Opening + Testing
                Get_TestStudents(thisTest.ID)
                .then((list) => {
                    thisTest.STUDENTS = list;
                    RunningTests[thisTest.ID] = thisTest;
                })
                .catch((error) => {
                    console.log(error);
                });
            }
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

        if(!socketIO) return outResolve({ status: false, message: "Socket không hoạt động" });

        Get_TestParts(testId)
        .then((result) => {
            if(result.status) {
                thisTest.STATUS = 2;
                thisTest.STARTTIME = new Date();
                thisTest.PARTS = result.parts;
                
                socketIO.to(thisTest.ID).emit('start_test', {
                    status: thisTest.STATUS,
                    startTime: thisTest.STARTTIME,
                    parts: ShuffleCheck_TestPart(thisTest.PARTS)
                });

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

function ShuffleCheck_TestPart(parts) {
    var newParts = Object.assign({}, parts);
    
    for(let p in newParts)
        for(let q of newParts[p].QUESTS)
            for(let a of q.ANSWERS)
                delete a.IsCorrect;
    
    return newParts;
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
                        ID: p.TestPartID,
                        NAME: p.PartName,
                        QUESTS: []
                    };
    
                    for(let q of allQuests) {
                        if(p.TestPartID == q.TestPartID) {
                            var thisQuest = {
                                ID: q.QuestID,
                                PARTQUESTID: q.PartQuestID,
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

function Get_TestStudents(testId) {
    return new Promise((outResolve, outReject) => {
        QueryNow(`SELECT st.StuTestID, st.UserID, st.TestID, st.JoinedDate, u.FirstName, u.LastName FROM studenttests st INNER JOIN users u ON st.UserID = u.UserID WHERE st.TestID = ?`, [testId])
        .then((students) => {
            var studentList = [];
            for(let st of students) {
                studentList[st.UserID] = {
                    StuTestID: Number(st.StuTestID),
                    UserID: Number(st.UserID),
                    TestID: Number(st.TestID),
                    JoinedDate: new Date(st.JoinedDate),
                    FirstName: st.FirstName,
                    LastName: st.LastName,
                    TestQuests: []
                }
            }

            outResolve(studentList);
        })
        .catch((error) => {
            return outReject('Không thể lấy danh sách sinh viên đang làm');
        })
    });
}

setInterval(function() {
    //console.log(RunningTests[8].PARTS);
}, 1500);

function ActivateSocket(io) {
    socketIO = io;
    io.on('connection', (socket) => {
        socket.on('join_room', (data) => { socketOnJoinRoom(io, socket, data); });
        socket.on('save_test', (data) => { socketOnSaveTest(socket, data); })
    });

    Log('Socket.IO Server has started alongside the HTTP Server');
}

function socketOnJoinRoom(io, socket, data) {
    var test = RunningTests[data.testId];
    if(!test || !test.STUDENTS[data.userId]) 
        return socket.disconnect();

    socket.join(test.ID);

    var user = test.STUDENTS[data.userId];
    if(!user) return socket.disconnect();

    socketUsers[user.UserID] = {
        socket: socket,
        testId: test.ID,
        userName: user.LastName + " " + user.FirstName
    }

    var lobby = [];
    for(let st of test.STUDENTS) {
        if(st) lobby.push(`${st.LastName} ${st.FirstName}`);
    }

    if(test.STATUS == 1)
        socket.emit('join_testinfo', {
            test: {
                ID: test.id,
                NAME: test.NAME,
                STARTTIME: test.STARTTIME,
                TESTTIME: test.TESTTIME,
                STATUS: test.STATUS
            },
            lobby: lobby
        });
    else if(test.STATUS == 2)
        socket.emit('join_testinfo', {
            test: {
                ID: test.id,
                NAME: test.NAME,
                STARTTIME: test.STARTTIME,
                TESTTIME: test.TESTTIME,
                STATUS: test.STATUS
            },
            parts: ShuffleCheck_TestPart(test.PARTS)
        });

    io.to(test.ID).emit('update_lobby', lobby);

    Log(`[Test Room ${socketUsers[user.UserID].testId}] Student ${socketUsers[user.UserID].userName} has connected `);

    socket.on('disconnect', () => { 
        socket.leave(test.ID);
        Log(`[Test Room ${socketUsers[user.UserID].testId}] Student ${socketUsers[user.UserID].userName} has disconnected `);
        socketUsers[user.UserID] = null 
    });
}

function socketOnSaveTest(socket, data) {
    var test = RunningTests[data.testId];
    if(!test || !test.STUDENTS[data.userId]) 
        return socket.disconnect();

    var user = test.STUDENTS[data.userId];
    if(!user) return socket.disconnect();

    if(socketUsers[user.UserID].socket != socket) {
        socket.emit('save_result', { status: false, message: 'Hành động bất hợp pháp, không thể lưu bài' });
        return;
    }

    var quests = data.quests;
    if(!quests || quests.length <= 0) {
        socket.emit('save_result', { status: false, message: 'Không có gì để lưu...' });
        return;
    }
    
    QueryNow(`SELECT stq.StuTestQuestID, stq.PartQuestID, stq.AnsID FROM studenttests st INNER JOIN testparts tp ON st.TestID = tp.TestID INNER JOIN partquests pq ON tp.TestPartID = pq.TestPartID INNER JOIN studenttestquests stq ON stq.PartQuestID = pq.PartQuestID WHERE st.UserID = ? AND st.TestID = ?;`, 
    [user.UserID, test.ID]).then((rows) => {
        var addList = [];
        var updateList = [];

        for(let qC of quests) {
            let found = false;
            for(let qS of rows) {
                if(qC.PartQuestID ==  qS.PartQuestID) {
                    c = true;
                    if(qC.AnsID != qS.AnsID) 
                        updateList.push({ 
                            StuTestQuestID: qS.StuTestQuestID,
                            PartQuestID: qS.PartQuestID,
                            AnsID: qC.AnsID
                        });
                    found = true;
                    break;
                }
            }

            if(!found) addList.push({
                PartQuestID: qC.PartQuestID,
                AnsID: qC.AnsID
            });
        }

        var promiseTasks = [];
        
        for(let q of addList)
            promiseTasks.push(QueryNow(`INSERT INTO studenttestquests (UserID,PartQuestID,AnsID) VALUES(?,?,?)`, [user.UserID, q.PartQuestID, q.AnsID]));
        for(let q of updateList)
            promiseTasks.push(QueryNow(`UPDATE studenttestquests SET AnsID = ? WHERE UserID = ? AND StuTestQuestID = ?`, [q.AnsID, user.UserID, q.StuTestQuestID]));

        if(promiseTasks.length > 0) {
            Promise.all(promiseTasks)
            .then((rows) => {
                socket.emit('save_result', { status: true, addList, updateList });
            })
            .catch((error) => {
                socket.emit('save_result', { status: false, message: "Không thể lưu bài do lỗi cập nhật" });
            });
        } else {
            socket.emit('save_result', { status: true });
        }
    })
    .catch((error) => {
        socket.emit('save_result', { status: false, message: "Không thể lưu bài do lỗi khi tìm câu hỏi" });
    });
}

function generateMessage(from, text) {
    return {
        from,
        text
    }
}

function JoinTest(testId, user)
{
    return new Promise((outResolve, outReject) => {
        if(!RunningTests[testId] || RunningTests[testId].STATUS != 1)
            return outReject('Bài kiểm tra không tồn tại hoặc không mở');
        if(RunningTests[testId].STUDENTS[user.UserID])
            return outResolve();
            
        var StuTestID = -1;
        QueryNow(`INSERT INTO studenttests (UserID,TestID,JoinedDate) VALUES(?,?,NOW())`, [user.UserID, testId])
        .then((rows) => {
            StuTestID = rows.insertId;
            return QueryNow(`SELECT st.StuTestID, st.TestID, st.JoinedDate, u.FirstName, u.LastName FROM studenttests st INNER JOIN users u ON st.UserID = u.UserID WHERE st.StuTestID = ?`, [StuTestID]);
        })
        .then((rows) => {
            if(rows.length <= 0) {
                QueryNow(`DELETE FROM studenttests WHERE StuTestID = ?`, [StuTestID]);
                return outReject('Có lỗi khi truy vấn nhập phòng');
            }

            RunningTests[testId].STUDENTS[user.UserID] = {
                StuTestID: Number(rows[0].StuTestID),
                UserID: user.UserID,
                TestID: testId,
                JoinedDate: new Date(rows[0].JoinedDate),
                FirstName: rows[0].FirstName,
                LastName: rows[0].LastName,
                TestQuests: []
            }

            outResolve();
        })
        .catch((error) => {
            return outReject('Có lỗi khi truy vấn nhập phòng');
        })
    });
}

