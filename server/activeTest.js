const socketIO = require('socket.io');

const config = require('./../config');
const { Log } = require('./utils/logger');
const { QueryNow } = require('./database');

module.exports = {
    CheckStartup,
    StartTest
};

var RunningTests = [];

function CheckStartup() {
    
}

function StartTest(testId) {
    return new Promise((resolve, reject) => {
        var thisTest = null;
       
        // return QueryNow(`UPDATE tests SET OpenStatus = 2, StartTime = NOW() WHERE TestID = ?`, [testId]);
        thisTest = "ok";
        QueryNow(`SELECT * FROM tests WHERE TestID = ?`, [testId])
        .then((rows) => {
            if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 1)
                return resolve({ status: false, message: 'Không thể tìm thấy bài kiểm tra này, hoặc bài kiểm tra này không ở trạng thái mở' });

            thisTest = {
                NAME: rows[0].TestName,
                PIN: rows[0].PINCode,
                STARTTIME: new DateTime(), // Temporarily
                TESTTIME: Number(rows[0].TestTime),
                PARTS: []
            };

            
            return QueryNow(`SELECT TestPartID, PartName FROM testparts WHERE TestID = ?`, [testInfo.TestID]);
        })
        .then((rows) => {
            if(rows.length <= 0)
                return resolve({ status: false, message: 'Bài kiểm tra này không có phần nào' });

            for(let p of rows) {
                QueryNow(`SELECT pq.PartQuestID, pq.QuestID, q.QuestContent FROM partquests pq INNER JOIN questions q on pq.QuestID = q.QuestID where pq.TestPartID = ?`, [p.TestPartID])
                .then((rows) => {

                })
            }
        })
        .catch((rows) => {
            return res.redirect('/dashboard/tests');
        })
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