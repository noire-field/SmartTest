const uuid = require('uuid');
const moment = require('moment');

const config = require('./../config');
const { Log } = require('./utils/logger');
const { QueryNow } = require('./database');

module.exports = {
    Startup,
    OpenRoom,
    IsUserInGame,
    GetRoomByID,
    RegisterRoutes,
};

var globalUserTokens = new Map();

var socket = {
    status: false,
    io: null
};

var GlobalGames = new Map();
var PINToID = new Map();

var Users = {
    Presenters: new Map(),
    Players: new Map()
};

var SocketUsers = new Map();
var UserInGame = new Map();


function RegisterRoutes(app) {
    // Present
    app.get('/present/:id?', RGet_Present);
    app.get('/present/:id?/presenter_act/:act?', RGet_PresentAction);
    app.get('/play/:id?/player_act/:act?', RGet_PlayerAction);

    // Player
    app.get('/findgame/:pin?', RGet_FindGame);
    app.get('/joingame/:pin?/:name?', RGet_JoinGame);
    app.get('/playing', RGet_Playing);

}

function RGet_Present(req, res, next)
{
    var roomId = req.params.id ? Number(req.params.id) : -1;
    if(!req.isAuthenticated() || req.user.RoleType < 1) 
        return res.redirect('/');

    var game = GetRoomByID(roomId);
    if(!game || game.OWNER.ID != req.user.UserID) return res.redirect('/');

    var data = {
        head_title: game.NAME + ' - ' + config.APP_NAME,
        appFullUrl: config.APP_URLFULL,
        user: req.user,
        gameId: game.ID,
        gamePIN: game.PIN
    };

    return res.render('present', data);
}

function RGet_PresentAction(req, res, next)
{
    var roomId = req.params.id ? Number(req.params.id) : -1;
    var act = req.params.act ? req.params.act : "";

    if(!req.isAuthenticated() || req.user.RoleType < 1) 
        return res.json({ success: false, message: "Unauthorized action."});

    var game = GetRoomByID(roomId);
    if(!game) return res.json({ success: false, message: "Game not found in system." });
    if(game.OWNER.ID != req.user.UserID) return res.json({ success: false, message: "Wrong game owner." });

    switch(act) {
        case 'get_data': return Present_GetData(game, res); 
        case 'start_game': return Present_StartGame(game, res);
        case 'check_answer': return Present_CheckAnswer(game, res);
    }

    return res.json({ success: false, message: "Unknown action" });
}

function RGet_PlayerAction(req, res, next)
{
    var roomId = req.params.id ? Number(req.params.id) : -1;
    var act = req.params.act ? req.params.act : "";
    
    var game = GetRoomByID(roomId);
    if(!game) return res.json({ success: false, message: "Game not found in system." });

    var userGameId = req.cookies.userGameId || "";

    // Is this user already in other active game (based on his/her secret id)
    if(userGameId.length > 0 && Users.Players.has(userGameId)) {
        var playerInfo = Users.Players.get(userGameId);
        if(playerInfo.gameId != roomId) return res.json({ success: false, message: "This is not your room." });
    }

    switch(act) {
        case 'get_data': return Player_GetData(game, res, userGameId);
        case 'send_answer': return Player_SendAnswer(game, req, res);
    }

    return res.json({ success: false, message: "Unknown action" });
}

function Present_GetData(game, res) {
    var newGame = {...game};
    var mappedData = [];

    newGame.PLAYERS.forEach((p) => { mappedData.push(Users.Players.get(p).name); });
    newGame.PLAYERS = mappedData;

    var retData = { success: true, game: newGame };

    if(game.DETAIL.STATUS == 2) {
        var quest = game.QUESTS.get(game.DETAIL.QUEST_IDLIST[game.DETAIL.QUEST_CURRENT-1]);
        var answersCount = [];

        game.CUR_QUEST_DATA.Answers.forEach(function(c) { answersCount.push(c.Count); });

        retData.correctAnswers = quest.CorrectAns
        retData.answersCount = answersCount;
    }

    return res.json(retData);
}

function Present_StartGame(game, res) {
    if(game.STATUS != 1)
        return res.json({ success: false, message: "Lệnh không hợp lệ, vui lòng tải lại trang." });

    // Main Status
    game.STATUS = 2;
    
    // Question Status
    game.DETAIL.STATUS = 1; // 1 = Viewing a question
    game.DETAIL.QUEST_CURRENT = 1; // First question

    var firstQuest = Get_A_Quest(game, game.DETAIL.QUEST_IDLIST[game.DETAIL.QUEST_CURRENT-1]);
    game.CUR_QUEST_DATA = firstQuest;

    if(Player_StartGame(game)) 
        Player_UpdateQuest(game, game.DETAIL.STATUS, firstQuest);

    return res.json({ success: true, game: { status: game.STATUS, detailStatus: game.DETAIL.STATUS, questTime: game.QUESTTIME }, quest: { number: game.DETAIL.QUEST_CURRENT, detail: firstQuest } });
}

function Present_CheckAnswer(game, res) {
    if(game.STATUS != 2 || game.DETAIL.STATUS != 1)
        return res.json({ success: false, message: "Lệnh không hợp lệ, vui lòng tải lại trang." });

    // Question Status
    game.DETAIL.STATUS = 2; // 2 = Checking result

    var quest = game.QUESTS.get(game.DETAIL.QUEST_IDLIST[game.DETAIL.QUEST_CURRENT-1]);
    var answersCount = [];

    game.CUR_QUEST_DATA.Answers.forEach(function(c) { answersCount.push(c.Count); });

    return res.json({ success: true, game: { detailStatus: game.DETAIL.STATUS }, correctAnswers: quest.CorrectAns, answersCount });
}

function Player_StartGame(game) {
    if(!game) return false;

    // Send necessary info to client before loading the first question
    socket.io.to(game.ID).emit('game_start', { success: true });
    return true;
}

function Player_SendAnswer(game, req, res) {
    var data = req.query;

    // Validate the nigger data
    if(data.questID) data.questID = Number(data.questID);
    if(data.ansID) data.ansID = Number(data.ansID);

    if(!Validate_Request(data, ['userGameId', 'questID', 'ansID'], { userGameId: 'string', questID: 'number', ansID: 'number' }))
        return res.json({ success: false, message: "Dữ liệu đáp án gửi đi không hợp lệ." });

    var userGameId = req.cookies.userGameId || "";
    if(userGameId != data.userGameId) return res.json({ success: false, message: "Danh tính không hợp lệ." });
    if(!game.PLAYERS.has(userGameId)) return res.json({ success: false, message: "Bạn không hề có trong phòng chơi này." });
    if(game.STATUS != 2 || game.DETAIL.STATUS != 1) return res.json({ success: false, message: "Không thể trả lời vào lúc này." });
    if(!game.CUR_QUEST_DATA) return res.json({ success: false, message: "Hiện tại không có câu hỏi nào." });
    if(game.CUR_QUEST_DATA.QuestID != data.questID) return res.json({ success: false, message: "Dữ liệu của bạn đã lỗi thời, hãy làm mới lại trang." });

    var thisQuest = game.QUESTS.get(data.questID);
    if(!thisQuest.Answers.has(data.ansID)) return res.json({ success: false, message: "Câu trả lời không hợp lệ." });

    var userPlay = Users.Players.get(userGameId).play;
    if(userPlay.latestAnswer.questID == data.questID) return res.json({ success: false, message: "Bạn đã trả lời câu hỏi này rồi." });

    userPlay.latestAnswer.questID = data.questID;

    if(thisQuest.CorrectAns.indexOf(data.ansID) != -1) { // Correct!
        userPlay.latestAnswer.isCorrect = true;

        // Calculate the point (WE ONLY CALCUALTE HERE, BUT WE WILL ADD WHEN THE QUESTION IS CLOSED)
        var duration = moment.duration(moment().diff(game.CUR_QUEST_DATA.GetTime)).asSeconds();
        var addPoint = 120 - Math.round(duration / game.QUESTTIME * 120);

        addPoint = addPoint > 100 ? 100 : addPoint < 50 ? 50 : addPoint;
        userPlay.latestAnswer.pointAdd = addPoint;
    } else { // Wrong bitch!
        userPlay.latestAnswer.isCorrect = false;
        userPlay.latestAnswer.pointAdd = 0;
    }

    for(let i = 0; i < game.CUR_QUEST_DATA.Answers.length; i++) {
        let thisAns = game.CUR_QUEST_DATA.Answers[i];
        if(thisAns.AnsID != data.ansID)
            continue;

        thisAns.Count++;
    }

    return res.json({ success: true, questID: data.questID });
}

function Player_UpdateQuest(game, detailStatus, quest) {
    if(!game) return false;

    if(detailStatus == 1) { // Send question
        socket.io.to(game.ID).emit('update_quest', { 
            success: true,
            detailStatus,
            quest
        });
    } else if(detailStatus == 2) { // Check answer

    }
}

function Player_GetData(game, res, userGameId) {
    var newGame = {
        ID: game.ID,
        NAME: game.NAME,
        STATUS: game.STATUS,
        DETAIL_STATUS: game.DETAIL.STATUS
    };

    if(game.STATUS == 2) {
        if(game.DETAIL.STATUS == 1) {
            newGame.CUR_QUEST_DATA = {...game.CUR_QUEST_DATA};

            for(let i = 0; i < newGame.CUR_QUEST_DATA.Answers.length; i++)
                delete(newGame.CUR_QUEST_DATA.Answers[i].Count);
            
            newGame.isAnswered = Users.Players.get(userGameId).play.latestAnswer.questID == newGame.CUR_QUEST_DATA.QuestID ? newGame.CUR_QUEST_DATA.QuestID : 0
        }
    }

    return res.json({ success: true, game: newGame });
}

function RGet_FindGame(req, res, next) {
    var PIN = req.params.pin || -1;

    if(!(new RegExp(/^\d{5}$/).test(PIN)))
        return res.json({ success: false, message: "Mã PIN không hợp lệ." });

    var game = GetRoomByPIN(PIN);
    if(!game) return res.json({ success: false, message: "Không tìm thấy phòng với mã PIN này." });
    if(game.STATUS != 1) return res.json({ success: false, message: "Phòng này đã đóng và đang chơi." });

    return res.json({ success: true, game: { NAME: game.NAME, PRESENTER: game.OWNER.NAME } });
}

function RGet_JoinGame(req, res, next) {
    var PIN = req.params.pin || -1;
    var name = req.params.name || "";

    // Check name
    var pattern = "^[a-zA-Z_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\\s]{1,24}$";
    if(!(new RegExp(pattern).test(name)))
        return res.redirect('/');

    // Valid room?
    if(!(new RegExp(/^\d{5}$/).test(PIN)))
        return res.redirect('/');

    var game = GetRoomByPIN(PIN);
    if(!game || game.STATUS != 1) return res.redirect('/');

    // Find the secret code
    var userGameId = req.cookies.userGameId || "";

    // Is this user already in other active game (based on his/her secret id)
    if(userGameId.length > 0 && Users.Players.has(userGameId)) {
        var playerInfo = Users.Players.get(userGameId);
        if(GetRoomByID(playerInfo.gameId)) return res.redirect('/'); // So his old game is still active
        else Users.Players.delete(userGameId);
    }

    // Looks like he's a valid player
    var playerUUID = uuid(); // Generate a random shit
    Users.Players.set(playerUUID, {
        name: name,
        gameId: game.ID,
        gamePIN: game.PIN,
        socket: null,
        play: {
            point: 0,
            correctAnswers: 0,
            latestAnswer: {
                questID: null,
                isCorrect: false,
                pointAdd: 0
            }
        }
    });
    
    game.PLAYERS.add(playerUUID);
    Update_PresentPlayerList(game);

    res.cookie('userGameId', playerUUID, {expire: 86400000 + Date.now()});
    return res.redirect('/playing');
}

function RGet_Playing(req, res, next) {
    // Retrieve user and his game from cookie
    var playerUUID = req.cookies.userGameId || "";
    if(playerUUID.length <= 0) return res.redirect('/');

    // Check user in system
    var userInfo = Users.Players.get(playerUUID);
    if(!userInfo) return res.clearCookie('userGameId').redirect('/');

    // Check his active game
    var game = GlobalGames.get(userInfo.gameId);
    if(!game) { // Looks like this guy is in system but no game, delete his shit then.
        Users.Players.delete(playerUUID);
        return res.clearCookie('userGameId').redirect('/');
    }

    var userGameId = req.cookies.userGameId || "";

    var data = {
        head_title: game.NAME + ' - ' + config.APP_NAME,
        appFullUrl: config.APP_URLFULL,
        gameId: game.ID,
        gamePIN: game.PIN,
        userGameId
    };

    return res.render('play', data);
}

function Get_A_Quest(Game, QuestID) {
    if(!Game.QUESTS.has(QuestID))
        return null;

    var quest = Game.QUESTS.get(QuestID);
    var newQuest = {
        QuestID: QuestID,
        Content: quest.Content,
        Answers: [],
        GetTime: moment()
    }

    quest.Answers.forEach((v, k) => {
        newQuest.Answers.push({
            AnsID: Number(k),
            Content: v.Content,
            Count: 0
        });
    });

    return newQuest;
}

// ======================================================
function Startup(io, globalTokens) {
    globalUserTokens = globalTokens;

    // Socket Server
    socket.io = io;
    socket.status = true;

    io.on('connection', (socket) => {
        socket.on('present_connect', (data) => { Socket_Present_OnConnect(socket, data); });
        socket.on('player_connect', (data) => { Socket_Player_OnConnect(socket, data); });
        //socket.on('save_test', (data) => { socketOnSaveTest(socket, data); })
    });

    Log('[Active Games] SocketIO server is started');

    // Reset Status
    QueryNow("UPDATE games SET OpenStatus = 0 WHERE OpenStatus = 1;").then((rows) => {

        // For Test purpose!
        OpenRoom(3).then(() => {
            Log(`[Active Games] Manually opened room 3`);
        });
        // End of Test

        if(rows.affectedRows <= 0) return
        Log(`[Active Games] Reseted ${rows.affectedRows} game(s) (Game lost when application crashed)`);
    });
}

function OpenRoom(gameId) {
    return new Promise((resolve, reject) => {
        var game = null;

        QueryNow(`SELECT g.*, u.FirstName, u.LastName FROM games g INNER JOIN users u ON g.OwnerID = u.UserID WHERE g.GameID = ?`, [gameId])
        .then((rows) => {
            if(rows.length <= 0 || Number(rows[0]['OpenStatus']) != 0)
                return resolve({ status: false, message: 'Không thể tìm thấy trò chơi này hoặc trò chơi đã mở.' });

            game = {
                ID: Number(rows[0].GameID),
                NAME: rows[0].GameName,
                PIN: rows[0].PINCode,
                QUESTTIME: Number(rows[0].TimePerQuest),
                STATUS: 1,
                DETAIL: {
                    STATUS: 0,
                    QUEST_CURRENT: 0,
                    QUEST_TOTAL: 0,
                    QUEST_IDLIST: []
                },
                OWNER: {
                    ID: Number(rows[0].OwnerID),
                    NAME: `${rows[0].FirstName} ${rows[0].LastName}`
                },
                PLAYERS: new Set(),
                QUESTS: new Map(),
                CUR_QUEST_DATA: null
            };

            return QueryNow(`SELECT * FROM questions WHERE SubjectID = ?`, [rows[0].SubjectID]);
        })
        .then((rows) => {
            if(rows.length <= 0)
                return resolve({ status: false, message: 'Có gì đó bị sai, bộ đề của trò chơi này không có bất kỳ câu hỏi nào.' });
        
            var questList = new Map();
            var questIDList = [];

            rows.forEach((r) => {
                questList.set(r.QuestID, {
                    Content: r.QuestContent,
                    Answers: new Map(),
                    CorrectAns: []
                });

                questIDList.push(r.QuestID);
            });

            game.QUESTS = questList;

            game.DETAIL.QUEST_CURRENT = 0;
            game.DETAIL.QUEST_TOTAL = questIDList.length;
            game.DETAIL.QUEST_IDLIST = questIDList;

            return QueryNow(`SELECT * FROM answers WHERE QuestID IN (${questIDList.join(',')})`);
        })
        .then((rows) => {
            if(rows.length <= 0)
                return resolve({ status: false, message: 'Có gì đó bị sai, bộ đề của trò chơi này không có bất kỳ câu trả lời nào.' });

            rows.forEach((r) => {
                let quest = game.QUESTS.get(r.QuestID);
                quest.Answers.set(r.AnsID, {
                    Content: r.AnsContent,
                    IsCorrect: Boolean(r.IsCorrect)
                })

                if(r.IsCorrect) quest.CorrectAns.push(r.AnsID);
            });

            return QueryNow(`UPDATE games SET OpenStatus = 1 WHERE GameID = ?`, [gameId])
        })
        .then((rows) => {
            GlobalGames.set(game.ID, game);
            PINToID.set(game.PIN, game.ID);

            resolve({ status: true });
        })
        .catch((error) => {
            return resolve({ status: false, message: 'Có gì đó đã xảy ra ở phía máy chủ' });
        })
    });
}

function GetRoomByID(roomId) {
    if(GlobalGames.has(roomId))
        return GlobalGames.get(roomId);
        
    return null;
}

function GetRoomByPIN(pin) {
    if(!PINToID.has(pin))
        return null;
    if(!GlobalGames.has(PINToID.get(pin))) {
        PINToID.delete(pin);
        return null;
    }

    return GlobalGames.get(PINToID.get(pin));
}

function IsUserInGame(uuid) {
    var userInfo = Users.Players.get(uuid);
    if(!userInfo) return false;
    
    var game = GlobalGames.get(userInfo.gameId);
    if(!game) { 
        Users.Players.delete(uuid);
        return false;
    }

    return true;
}

function Socket_Present_OnConnect(client, data) {
    if(!Validate_Request(data, ['userId', 'gameId', 'gamePIN', 'userToken'], { userId: "number", gameId: "number", gamePIN: "string", userToken: "string" }))
    {
        client.disconnect(); Log(`[Active Games] Presenter (S-ID: ${client.id}) has connected but then disconnected by system (missing parameters).`); 
        return;
    }
    if(!Verify_PresenterToken(data.userId, data.userToken))
    {
        client.disconnect(); Log(`[Active Games] Presenter (S-ID: ${client.id}) has connected but then disconnected by system (Invalid token).`); 
        return;
    }
    if(!Verify_GameOwnerInfo(data.userId, data.gameId, data.gamePIN))
    {
        client.disconnect(); Log(`[Active Games] Presenter (S-ID: ${client.id}) has connected but then disconnected by system (Invalid game info or not game owner).`);
        return;
    }

    // Register disconnect event
    client.on('disconnect', () => { Socket_User_OnDisconnect(client); });

    SocketUsers.set(client.id, {
        TYPE: 1,
        GAMEID: data.gameId,
        USERID: data.userId
    });

    if(!Users.Presenters.has(data.userId)) {
        Users.Presenters.set(data.userId, {
            socket: client
        });
    } else {
        var presenter = Users.Presenters.get(data.userId);
        var oldSocket = presenter.socket;

        presenter.socket = client; // Replace with new socket
        oldSocket.disconnect(); // Disconnect previous socket
    }

    client.emit('presenter_verified', { success: true });
    Log(`[Active Games] Presenter (S-ID: ${client.id}) has connected!`);
}

function Socket_Player_OnConnect(client, data) {
    if(!Validate_Request(data, ['gameId', 'gamePIN', 'userGameId', ], { gameId: "number", gamePIN: "string", userGameId: "string" }))
    {
        client.disconnect(); Log(`[Active Games] Player (S-ID: ${client.id}) has connected but then disconnected by system (missing parameters).`); 
        return;
    }
    if(!Verify_GameInfo(data.gameId, data.gamePIN))
    {
        client.disconnect(); Log(`[Active Games] Player (S-ID: ${client.id}) has connected but then disconnected by system (Invalid game info).`);
        return;
    }
    if(!Verify_PlayerInfo(data.gameId, data.userGameId))
    {
        client.disconnect(); Log(`[Active Games] Player (S-ID: ${client.id}) has connected but then disconnected by system (Invalid token).`); 
        return;
    }

    // Is he connected before?
    var userData = Users.Players.get(data.userGameId);
    if(userData.socket) { // Is already connected
        // Then disconnect it before making new one
        SocketUsers.delete(userData.socket.id);
        Log(`[Active Games] Player (New S-ID: ${client.id}) disconnected his old session (Old S-ID: ${userData.socket.id}).`); 

        userData.socket.leave(data.gameId);
        userData.socket.disconnect();
        userData.socket = null;
    }

    // Register disconnect event
    client.on('disconnect', () => { Socket_User_OnDisconnect(client); });

    SocketUsers.set(client.id, {
        TYPE: 0,
        GAMEID: data.gameId,
        UUID: data.userGameId
    });

    userData.socket = client;

    // Join socket room
    client.join(data.gameId);

    client.emit('player_verified', { success: true });
    Log(`[Active Games] Player (S-ID: ${client.id}) has connected!`);
}

function Socket_User_OnDisconnect(client) {
    // Check and delete the user if the final socket is disconnected
    var userData = SocketUsers.get(client.id);
    if(!userData) return;

    if(userData.TYPE == 1) {// 1 = Lecturer
        if(Users.Presenters.has(userData.USERID)) { 
            var presenter = Users.Presenters.get(userData.USERID);
            if(presenter.socket.id == client.id) {
                Users.Presenters.delete(client.id);
                Log(`[Active Games] Presenter (${userData.USERID}) has been deleted from Users/Presenters.`);
            }
        }

        Log(`[Active Games] Presenter (S-ID: ${client.id}) has disconnected!`);
    } else if(userData.TYPE == 0) { // 0 = Players
        if(Users.Players.has(userData.UUID)) { 
            var player = Users.Players.get(userData.UUID);
            if(player.socket.id == client.id) {
                player.socket = null; // We don't delete the nigger player like presenter.
                Log(`[Active Games] Player (${userData.UUID}) has unset his final socket.`);
            }
        }
    }

    SocketUsers.delete(client.id);
}


function Update_PresentPlayerList(game) {
    var playerList = [];

    game.PLAYERS.forEach((p) => {
        playerList.push(Users.Players.get(p).name);
    });

    var ownerId = game.OWNER.ID;
    if(Users.Presenters.has(ownerId)) {
        var presentSocket = Users.Presenters.get(ownerId).socket;
        presentSocket.emit('presenter_update_playerlist', { players: playerList });
    }
}

function Verify_PresenterToken(userId, userToken) {
    if(globalUserTokens.has(userId) && globalUserTokens.get(userId) == userToken)
        return true;

    return false;
}

function Verify_GameOwnerInfo(userId, gameId, gamePIN) {
    if(GlobalGames.has(gameId) && GlobalGames.get(gameId).PIN == gamePIN && GlobalGames.get(gameId).OWNER.ID == userId)
        return true;

    return false;
}

function Verify_GameInfo(gameId, gamePIN) {
    if(GlobalGames.has(gameId) && GlobalGames.get(gameId).PIN == gamePIN)
        return true;

    return false;
}

function Verify_PlayerInfo(gameId, userGameId) {
    // Is she in our system?
    if(!Users.Players.has(userGameId))
        return false;

    var userInfo = Users.Players.get(userGameId);
    if(userInfo.gameId != gameId) // Is this UUID user's gameId right?
        return false;

    var game = GetRoomByID(gameId);
    if(!game.PLAYERS.has(userGameId))
        return false;
    
    return true;
}

function Validate_Request(data={}, require=[], type={}, size={}) {
    if(!data)
        return false;
    if(typeof data !== 'object')
        return false;

    for(let p of require) {
        if(!data.hasOwnProperty(p))
            return false;
    }

    for(let p in type) {
        if(typeof data[p] !== type[p])
            return false;
    }

    for(let s in size) {
        if(data[s].length < size[s][0] || data[s].length > size[s][1])
            return false;
    }

    return true;
}


/*
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
                STUDENTS: [],
                TIMER: null,
                MAPQUESTS: null
            };

            if(thisTest.STATUS >= 1) { // Opening + Testing
                Get_TestStudents(thisTest.ID)
                .then((list) => {
                    thisTest.STUDENTS = list;
                    RunningTests[thisTest.ID] = thisTest;

                    if(thisTest.STATUS == 2)
                        Get_StudentSavedQuests(thisTest);
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

                        thisTest.MAPQUESTS = TestMapQuests(thisTest);
                    }
                });

                thisTest.TIMER = setInterval(() => {
                    let currentTest = thisTest;
                    CheckTestTimer(currentTest);
                }, 1000);
            } else {
                RunningTests[thisTest.ID] = thisTest;
            }
        }
    });
}

function CloseTest(testId) {
    return new Promise((resolve, reject) => {
        var thisTest = RunningTests[testId]
        if(!thisTest) return resolve({ status: false, message: 'Không thể tìm thấy bài kiểm tra này hoặc bài kiểm tra này không hoạt động.' });
        if(thisTest.STATUS != 2) return resolve({ status: false, message: 'Không thể đóng bài kiểm tra này hoặc nó đã bị đóng rồi.' });

        thisTest.TESTTIME = 0;
        CheckTestTimer(thisTest);

        resolve({ status: true });
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
                thisTest.TIMER = setInterval(() => {
                    let currentTest = thisTest;
                    CheckTestTimer(currentTest);
                }, 1000);
                thisTest.MAPQUESTS = TestMapQuests(thisTest);
                
                socketIO.to(thisTest.ID).emit('start_test', {
                    status: thisTest.STATUS,
                    startTime: thisTest.STARTTIME,
                    parts: ShuffleCheck_TestPart(thisTest.PARTS)
                });

                CheckTestTimer(thisTest);

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

function CheckTestTimer(test) {
    if(!test) return;
    if(test.STATUS != 2) {
        if(test.TIMER) clearInterval(test.TIMER);
        return;
    }
    if(!socketIO) {
        Log('[WARNING] Socket.IO is not running while a testing is taking place...');
        return;
    }
    
    var currentTime = new Date();
    var testStartTime = new Date(test.STARTTIME);
    var testEndTime = new Date(testStartTime.getTime() + ((test.TESTTIME * 60) * 1000));

    if(currentTime < testEndTime) {
        var remainSec = Math.round((testEndTime-currentTime) / 1000);
        var min = Math.floor(remainSec / 60);
        var sec = remainSec % 60;

        socketIO.to(test.ID).emit('update_time', {
            timeleft: [
                (min < 10 ? "0" : "") + min,
                (sec < 10 ? "0" : "") + sec
            ]
        });
    } else {
        test.STATUS = 3;
        if(test.TIMER) clearInterval(test.TIMER);
        
        socketIO.to(test.ID).emit('update_time', {
            timeleft: [ "00", "00" ]
        });

        CheckTestMarks(test);

        var promiseTasks = [];

        // Transfer result to client
        for(let st of test.STUDENTS) {
            if(!st) continue;
            if(socketUsers[st.UserID]) 
                socketUsers[st.UserID].socket.emit('finish_test', {
                    correctAnswers: st.CorrectCount,
                    totalAnswers: test.MAPQUESTS.size
                });

            promiseTasks.push(QueryNow(`INSERT INTO TestResults (UserID,TestID,CorrectCount,TotalCount,CheckedDate) VALUES(?,?,?,?,NOW())`,
            [st.UserID, test.ID, st.CorrectCount, test.MAPQUESTS.size]));
        }

        Promise.all(promiseTasks).then((rows) => {

        }).catch((error) => {
            Log(`[Save Test Result] ${error}`);
        });

        QueryNow(`UPDATE tests SET OpenStatus = 3 WHERE TestID = ?`, [test.ID]);
        RunningTests[test.ID] = null;

        return;
    }
}

function TestMapQuests(test) {
    var mapQuests = new Map();
    for(let p of test.PARTS) {
        for(let q of p.QUESTS) {
            var correctAnswer = 0;
            for(let a of q.ANSWERS) 
               if(a.IsCorrect) {
                   correctAnswer = a.AnsID
                   break;
               }
            mapQuests.set(q.PARTQUESTID, correctAnswer);
        }
    }

    return mapQuests;
}

// mapQuests.set(q.PARTQUESTID, )
function CheckTestMarks(test) {
    for(let st of test.STUDENTS) {
        if(!st) continue;
        let totalCorrect = 0;
        for(let q of st.TestQuests) {
            if(test.MAPQUESTS.get(q.PartQuestID) == q.AnsID)
                totalCorrect++;
        }

        st.CorrectCount = totalCorrect;
    }
}

function ShuffleCheck_TestPart(parts) {
    var newParts = Object.assign({}, parts);
    
    for(let p in newParts)
        for(let q of newParts[p].QUESTS)
            for(let a of q.ANSWERS) {
                a = Object.assign({}, a);
                delete a.IsCorrect;
            }

    return newParts;
}

function Get_TestParts(testId) {
    return new Promise((outResolve, outReject) => {
        QueryNow(`SELECT TestPartID, PartName FROM testparts WHERE TestID = ? ORDER BY DisplayOrder ASC`, [testId])
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
                    TestQuests: [],
                    CorrectCount: 0
                }
            }

            outResolve(studentList);
        })
        .catch((error) => {
            return outReject('Không thể lấy danh sách sinh viên đang làm');
        })
    });
}

function Get_StudentSavedQuests(test) {
    for(let st of test.STUDENTS)
    {
        if(!st) continue;
        QueryNow(`SELECT stq.StuTestQuestID, stq.PartQuestID, stq.AnsID FROM studenttests st INNER JOIN testparts tp ON st.TestID = tp.TestID INNER JOIN partquests pq ON tp.TestPartID = pq.TestPartID INNER JOIN studenttestquests stq ON stq.PartQuestID = pq.PartQuestID WHERE st.UserID = ? AND st.TestID = ?;`, 
        [st.UserID, test.ID])
        .then((rows) => {
            st.TestQuests = rows;
        });
    }
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

    // Check and kick the previous user
    if(socketUsers[user.UserID]) {
        socketUsers[user.UserID].socket.emit('login_kick');
        socketUsers[user.UserID].socket.disconnect();
    }

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
    else if(test.STATUS == 2) {
        QueryNow(`SELECT stq.StuTestQuestID, stq.PartQuestID, stq.AnsID FROM studenttests st INNER JOIN testparts tp ON st.TestID = tp.TestID INNER JOIN partquests pq ON tp.TestPartID = pq.TestPartID INNER JOIN studenttestquests stq ON stq.PartQuestID = pq.PartQuestID WHERE st.UserID = ? AND st.TestID = ?;`, 
        [user.UserID, test.ID])
        .then((rows) => {
            socket.emit('join_testinfo', {
                test: {
                    ID: test.id,
                    NAME: test.NAME,
                    STARTTIME: test.STARTTIME,
                    TESTTIME: test.TESTTIME,
                    STATUS: test.STATUS
                },
                parts: ShuffleCheck_TestPart(test.PARTS),
                preSaved: rows
            });
        })
        .catch((error) => {
            console.log('Something went wrong at the socketOnJoinRoom');
        });
    }
        
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
                user.TestQuests = quests;
                socket.emit('save_result', { status: true, savedCount: quests.length, addList, updateList });
            })
            .catch((error) => {
                socket.emit('save_result', { status: false, message: "Không thể lưu bài do lỗi cập nhật" });
            });
        } else {
            user.TestQuests = quests;
            socket.emit('save_result', { status: true, savedCount: quests.length });
        }
    })
    .catch((error) => {
        socket.emit('save_result', { status: false, message: "Không thể lưu bài do lỗi khi tìm câu hỏi" });
    });
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
}*/