let WebSocketSettings = {
    ws: {
        url: "wss://cloud.achex.ca/nakn_jp_online_othello"
    },
    roomKey: "0000",
    userId: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    userPwd: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    toGameRoomKey: null,
    host: true,
    playerListA: [],
    nickNameListA: {},
    mRoomKey: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    roomHost: null,
    closed: false,
    playerMax: 4,
    playerListRoom: [],
    connected: false,
    started: false,
    isFinish: false,
    nickname: null,
    gameBoardLength: 8,
    version: "202207271243"
}
WebSocketSettings.ws.url = WebSocketSettings.ws.url + `_${WebSocketSettings.version}`;

let _wsTimer = null;
let lastSet = null;
let _wsPingTimer = null;

//OsakaHumanManyMany
let _ws;
function websocketStart() {
    if (_ws) return;
    roomKeySetIs = true;
    // WebSocketサーバーに接続
    statusMessage.color = [255, 255, 255];
    statusMessage.string = "サーバーに接続中です...";
    _ws = new WebSocket(WebSocketSettings.ws.url);
    //接続通知
    _ws.onopen = function() {
        WebSocketSettings.closed = false;
        statusMessage.color = [255, 255, 255];
        statusMessage.string = "サーバーに接続しました...ログインしています...";
        _ws.send(JSON.stringify(	{"auth":WebSocketSettings.userId,"passwd":WebSocketSettings.userPwd}))
        //メッセージ受信
        _ws.onmessage = function(event) {
            console.log(event.data);
            let data = JSON.parse(event.data);
            if (data.auth) {
                if (data.auth === "OK") {
                    statusMessage.color = [255, 255, 255];
                    statusMessage.string = "ログインしました。ルームに参加中です...";
                    _ws.send(JSON.stringify({"joinHub": WebSocketSettings.toGameRoomKey||WebSocketSettings.roomKey}))
                } else {
                    statusMessage.string = "認証に失敗しました。";
                    statusMessage.color = [255, 0, 0];
                    return;
                }
            }
            if (data.joinHub) {
                if (data.joinHub === "OK") {
                    if (WebSocketSettings.toGameRoomKey) {
                        statusMessage.color = [255, 255, 255];
                        WebSocketSettings.playerListRoom = [];
                        WebSocketSettings.playerListRoom.push(WebSocketSettings.userId);
                        WebSocketSettings.nickNameListA[WebSocketSettings.userId] = WebSocketSettings.nickname;
                        statusMessage.string = `ルームに参加しました。他のプレイヤーを待っています... (${WebSocketSettings.playerListRoom.length}/${WebSocketSettings.playerListA.length})`;
                        _ws.send(JSON.stringify({"toH":WebSocketSettings.toGameRoomKey, "type":"joinedCheck", "nickname":WebSocketSettings.nickname}));
                        if (WebSocketSettings.host) {
                            _wsPingTimer = setInterval(() => {
                                WebSocketSettings.playerListRoom = [];
                                WebSocketSettings.playerListRoom.push(WebSocketSettings.userId);
                                WebSocketSettings.nickNameListA[WebSocketSettings.userId] = WebSocketSettings.nickname;
                                _ws.send(JSON.stringify({
                                    "toH": WebSocketSettings.toGameRoomKey,
                                    "type": "pleaseJoinedPing"
                                }));
                            }, 5000);
                        }
                    } else {
                        statusMessage.color = [255, 255, 255];
                        statusMessage.string = `ルームに参加しました。プレイヤーを探しています... (${WebSocketSettings.playerListA.length+1}/${WebSocketSettings.playerMax})`;
                        WebSocketSettings.playerListA.push(WebSocketSettings.userId);
                        _ws.send(JSON.stringify({"toH":WebSocketSettings.roomKey, "type":"matchingPlease"}));
                    }
                } else {
                    statusMessage.string = "ルームの接続に失敗しました。";
                    statusMessage.color = [255, 0, 0];
                    return;
                }
            }
            if (data.type) {
                if (data.type === "joinedCheck") {
                    statusMessage.color = [255, 255, 255];
                    WebSocketSettings.playerListRoom.push(data.FROM);
                    WebSocketSettings.nickNameListA[data.FROM] = data.nickname;
                    statusMessage.string = `ルームに参加しました。他のプレイヤーを待っています... (${WebSocketSettings.playerListRoom.length}/${WebSocketSettings.playerListA.length})`;
                    if (WebSocketSettings.host) {
                        if (WebSocketSettings.playerListA.length <= WebSocketSettings.playerListRoom.length) {
                            _ws.send(JSON.stringify({"toH":WebSocketSettings.toGameRoomKey, "type":"startGame"}));
                            ws_startGame();
                        }
                    }
                }
                if (data.type === "pleaseJoinedPing") {
                    _ws.send(JSON.stringify({"to":WebSocketSettings.roomHost, "type":"joinedPing", "nickname":WebSocketSettings.nickname}));
                }
                if (data.type === "joinedPing") {
                    if (WebSocketSettings.host) {
                        WebSocketSettings.playerListRoom.push(data.FROM);
                        WebSocketSettings.nickNameListA[data.FROM] = data.nickname;

                        if (WebSocketSettings.playerListA.length <= WebSocketSettings.playerListRoom.length) {
                            clearInterval(_wsPingTimer);
                            _ws.send(JSON.stringify({"toH":WebSocketSettings.toGameRoomKey, "type":"startGame"}));
                            ws_startGame();
                        }
                    }
                }
                if (data.type === "startGame") {
                    ws_startGame();
                }
                if (data.type === "matchingPlease") {
                    if (!WebSocketSettings.host || WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) return;
                    _ws.send(JSON.stringify({"to":data.FROM, "type":"matchingOK", "list":WebSocketSettings.playerListA, "myRoomKey": WebSocketSettings.mRoomKey}));
                }
                if (data.type === "matchingOK") {
                    if (data.list.length < WebSocketSettings.playerListA.length) {
                        // 自分がホスト
                        WebSocketSettings.host = true;
                        WebSocketSettings.connected = true;
                        _ws.send(JSON.stringify({"to": data.FROM, "type": "matchingMyHost", "list": WebSocketSettings.playerListA, "myRoomKey": WebSocketSettings.mRoomKey}));
                        WebSocketSettings.roomHost = WebSocketSettings.userId;
                    } else {
                        // お前がホスト
                        WebSocketSettings.host = false;
                        WebSocketSettings.connected = true;
                        _ws.send(JSON.stringify({"to": data.FROM, "type": "matchingYourHost", "list": WebSocketSettings.playerListA, "roomKey": data.myRoomKey}));
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                        WebSocketSettings.roomHost = data.FROM;
                    }
                }
                if (data.type === "matchingYourHost") {
                    WebSocketSettings.connected = true;
                    WebSocketSettings.playerListA = Array.from(new Set(WebSocketSettings.playerListA.concat(data.list)));
                    statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    for (const playerListKey in WebSocketSettings.playerListA) {
                        if (WebSocketSettings.playerListA[playerListKey] === WebSocketSettings.userId) continue;
                        _ws.send(JSON.stringify({"to": WebSocketSettings.playerListA[playerListKey], "type": "matchingPlayerList", "list": WebSocketSettings.playerListA, "roomKey": WebSocketSettings.mRoomKey}));
                    }
                    if (WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) {
                        startCount();
                    }
                }
                if (data.type === "matchingPlayerList") {
                    WebSocketSettings.playerListA = data.list;
                    if (WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) {
                        statusMessage.string = `もうしばらくお待ちください... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    } else {
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    }
                }
                if (data.type === "matchingTimer") {
                    statusMessage.string = `まもなく始まります... (${data.waitTime})`;
                }

                if (data.type === "goRoomA") {
                    WebSocketSettings.mRoomKey = data.roomKey;
                    ws_goRoom();
                }
                if (data.type === "nextPlayerRefresh") {
                    if (data.FROM !== WebSocketSettings.roomHost) return;
                    nowPiece = json_GunZip(data.nowPiece);
                    nowNumber = data.nowNumber;
                    zeroCanPoint = json_GunZip(data.zeroCanPoint);
                    canPoint = json_GunZip(data.canPoint);
                    zeroIs = data.zeroIs;
                    setOthello = data.setOthello;
                    _clicked = false;
                    showPlayerMessage();
                }
                if (data.type === "skipPlayer") {
                    if (data.FROM !== WebSocketSettings.roomHost) return;
                    nowPiece = json_GunZip(data.nowPiece);
                    nowNumber = data.nowNumber;
                    zeroCanPoint = json_GunZip(data.zeroCanPoint);
                    canPoint = json_GunZip(data.canPoint);
                    zeroIs = data.zeroIs;
                    statusMessage.string = `${playerColorString[data.nowNumber]}がスキップされます。`;
                    showPlayerMessage("skip");
                }
                if (data.type === "dataRefresh") {
                    if (data.FROM !== WebSocketSettings.roomHost) return;
                    nowPiece = json_GunZip(data.nowPiece);
                    nowNumber = data.nowNumber;
                    zeroCanPoint = json_GunZip(data.zeroCanPoint);
                    canPoint = json_GunZip(data.canPoint);
                    zeroIs = data.zeroIs;
                }
                if (data.type === "setOthello") {
                    if (data.FROM !== playerList[nowNumber].id) return;
                    let nowSet = new Date().getTime();
                    if ((nowSet-lastSet)<500) {
                        _ws.send(JSON.stringify({
                            "to": data.FROM,
                            "type": "setFast",
                            "roomKey": WebSocketSettings.mRoomKey
                        }));
                        return;
                    }
                    zeroIs = false;
                    nowPiece[data.panel[0]][data.panel[1]].id = nowNumber;
                    setOthello.push({
                        panel: data.panel,
                        color: [255, 255, 0, 1]
                    });
                    setOthelloTurn(data.panel[0], data.panel[1]);
                    nextPlayer();
                }
                if (data.type === "setFast") {
                    _clicked = false;
                }
                if (data.type === "setOthelloEvery") {
                    setOthello.push({
                        panel: data.panel,
                        color: [255, 255, 0, 1]
                    });
                    statusMessage.string = `${playerColorString[data.setUser]}が設置しました。`;
                    clearInterval(_playerTimer);
                    playerTimerCount = 15;
                }
                if (data.type === "finish") {
                    WebSocketSettings.isFinish = true;
                    boardLength = 8;
                    getSize();
                    setTimeout(()=>{
                        WebSocketSettings.closed = true;
                        startNow = false;
                        _ws.close();
                    }, 2000);
                }
                if (data.type === "playerTimerCount") {
                    playerTimerCount = data.playerTimerCount;
                }
                if (data.type === "pushPlayerList") {
                    playerList = data.playerList;
                    boardLength = data.boardLength;
                    WebSocketSettings.gameBoardLength = boardLength;
                    getSize();
                }
            }
            if (data.leftHub) {
                if (WebSocketSettings.toGameRoomKey) {
                    WebSocketSettings.closed = true;
                    _ws.close();
                    startNow = false;
                    statusMessage.string = "相手が切断したため終了しました。";
                    statusMessage.color = [255, 0, 0];
                    WebSocketSettings.isFinish = true;
                    boardLength = 8;
                    getSize();
                } else {
                    if (WebSocketSettings.host) {
                        if (!WebSocketSettings.playerListA.includes(data.user)) return;
                        WebSocketSettings.playerListA = WebSocketSettings.playerListA.filter(f => f !== data.user);
                        if (_wsTimer) {
                            clearInterval(_wsTimer);
                        }
                        WebSocketSettings.started = false;
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length + 1}/${WebSocketSettings.playerMax})`;
                        for (const playerListKey in WebSocketSettings.playerListA) {
                            _ws.send(JSON.stringify({
                                "to": WebSocketSettings.playerListA[playerListKey],
                                "type": "matchingPlayerList",
                                "list": WebSocketSettings.playerListA,
                                "roomKey": WebSocketSettings.mRoomKey
                            }));
                        }
                    } else {
                        if (WebSocketSettings.roomHost === data.user) {
                            statusMessage.string = "ホストユーザーが抜けたため切断しました。";
                            statusMessage.color = [255, 0, 0];
                        }
                    }
                }
            }
        };

        //切断
        _ws.onclose = function() {
            if (WebSocketSettings.closed) return;
            statusMessage.string = "サーバーから切断されました。";
            statusMessage.color = [255, 0, 0];
        };
    };

    //エラー発生
    _ws.onerror = function(error) {
        console.error(error);
        statusMessage.string = "エラーが発生しました。";
        statusMessage.color = [255, 0, 0];
    };
}

function startCount () {
    WebSocketSettings.started = true;
    let waitTime = 5;
    _wsTimer = setInterval(() => {
        if (0 > waitTime) {
            clearInterval(_wsTimer);
            ws_goRoom();
            return;
        }
        for (const playerListKey in WebSocketSettings.playerListA) {
            if (WebSocketSettings.playerListA[playerListKey] === WebSocketSettings.userId) continue;
            _ws.send(JSON.stringify({
                "to": WebSocketSettings.playerListA[playerListKey],
                "type": "matchingTimer",
                "waitTime": waitTime,
                "roomKey": WebSocketSettings.mRoomKey
            }));
        }
        statusMessage.string = `まもなく始まります... (${waitTime})`;
        waitTime--;
    }, 1000);
}
function ws_startGame () {
    for (let i = 0; i < WebSocketSettings.playerMax; i++) {
        if (WebSocketSettings.playerListA[i]) {
            playerList[i + 1] = {
                id: WebSocketSettings.playerListA[i],
                name: WebSocketSettings.nickNameListA[WebSocketSettings.playerListA[i]] ? `${WebSocketSettings.nickNameListA[WebSocketSettings.playerListA[i]]} (${playerColorString[i + 1]})` : playerColorString[i + 1],
                cpu: false,
            }
            if (WebSocketSettings.userId === WebSocketSettings.playerListA[i]) myNumber = i + 1;
        } else {
            playerList[i + 1] = {
                id: `CPU${i + 1}`,
                name: playerColorString[i + 1],
                cpu: true
            }
        }
        if (WebSocketSettings.host) {
            let boardLengthGet = getParam("board");
            let boardLengthNumber = boardLength;
            if (boardLengthGet) {
                boardLengthNumber = Number(boardLengthGet);
                if (boardLengthNumber % 2 !== 0) {
                    boardLengthNumber = 8;
                }
            }
            boardLength = boardLengthNumber;
            WebSocketSettings.gameBoardLength = boardLength;
            getSize();
            _ws.send(JSON.stringify({
                "toH": WebSocketSettings.toGameRoomKey,
                "type": "pushPlayerList",
                "playerList": playerList,
                "roomKey": WebSocketSettings.mRoomKey,
                "boardLength": boardLengthNumber
            }));
        }
    }
    statusMessage.color = [255, 255, 255];
    statusMessage.string = "ゲームを開始します。";
    startNow = true;
    clearInterval(_wsPingTimer);
    init();

}

function ws_goRoom () {
    if (WebSocketSettings.host) {
        for (const playerListKey in WebSocketSettings.playerListA) {
            if (WebSocketSettings.playerListA[playerListKey] === WebSocketSettings.userId) continue;
            _ws.send(JSON.stringify({
                "to": WebSocketSettings.playerListA[playerListKey],
                "type": "goRoomA",
                "list": WebSocketSettings.playerListA,
                "roomKey": WebSocketSettings.mRoomKey
            }));
        }
    }
    WebSocketSettings.toGameRoomKey = WebSocketSettings.mRoomKey;
    WebSocketSettings.closed = true;
    _ws.close();
    _ws = null;
    websocketStart();
}

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// gzip化
function json_gZip (json) {
    let jsonPlain = new TextEncoder().encode(JSON.stringify(json));

    let gzip = new Zlib.Gzip(jsonPlain);
    let compressed = gzip.compress();
    return uint8ArrayToBase64(compressed);
}

// gunZip化
function json_GunZip (string) {
    let gunzip = new Zlib.Gunzip(base64ToUint8Array(string));
    let jsonPlain = gunzip.decompress();

    let json = new TextDecoder().decode(jsonPlain);
    return JSON.parse(json);
}

function uint8ArrayToBase64(uint8Array) {
    return btoa(String.fromCharCode(...uint8Array));
}

function base64ToUint8Array(base64Str) {
    const raw = atob(base64Str);
    return Uint8Array.from(Array.prototype.map.call(raw, (x) => {
        return x.charCodeAt(0);
    }));
}