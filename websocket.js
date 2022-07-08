let WebSocketSettings = {
    ws: {
        url: "wss://cloud.achex.ca/nakn_jp_online_othello"
    },
    roomKey: "default",
    userId: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    userPwd: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    toGameRoomKey: null,
    last_ping: null,
    host: true,
    playerListA: [],
    mRoomKey: String(Math.floor( Math.random() * (9999-1111) ) + 1111),
    roomHost: null,
    closed: false,
    playerMax: 4
}
let _wsTimer = null;

//OsakaHumanManyMany
let _ws;
function websocketStart() {
    if (_ws) return;
    // WebSocketサーバーに接続
    statusMessage.color = [255, 255, 255];
    statusMessage.string = "サーバーに接続中です...";
    getSize();
    _ws = new WebSocket(WebSocketSettings.ws.url);
    //接続通知
    _ws.onopen = function(event) {
        WebSocketSettings.closed = false;
        statusMessage.color = [255, 255, 255];
        statusMessage.string = "サーバーに接続しました...ログインしています...";
        getSize();
        _ws.send(JSON.stringify(	{"auth":WebSocketSettings.userId,"passwd":WebSocketSettings.userPwd}))
        //メッセージ受信
        _ws.onmessage = function(event) {
            console.log(event.data);
            let data = JSON.parse(event.data);
            if (data.auth) {
                if (data.auth == "OK") {
                    statusMessage.color = [255, 255, 255];
                    statusMessage.string = "ログインしました。ルームに参加中です...";
                    getSize();
                    _ws.send(JSON.stringify({"joinHub": WebSocketSettings.toGameRoomKey||WebSocketSettings.roomKey}))
                } else {
                    statusMessage.string = "認証に失敗しました。";
                    statusMessage.color = [255, 0, 0];
                    getSize();
                    return;
                }
            }
            if (data.joinHub) {
                if (data.joinHub == "OK") {
                    if (WebSocketSettings.toGameRoomKey) {
                        ws_startGame();
                    } else {
                        statusMessage.color = [255, 255, 255];
                        statusMessage.string = `ルームに参加しました。プレイヤーを探しています... (${WebSocketSettings.playerListA.length+1}/${WebSocketSettings.playerMax})`;
                        WebSocketSettings.playerListA.push(WebSocketSettings.userId);
                        getSize();
                        _ws.send(JSON.stringify({"toH":WebSocketSettings.roomKey, "type":"matchingPlease"}));
                    }
                } else {
                    statusMessage.string = "ルームの接続に失敗しました。";
                    statusMessage.color = [255, 0, 0];
                    getSize();
                    return;
                }
            }
            if (data.type) {
                if (data.type == "matchingPlease") {
                    if (!WebSocketSettings.host || WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) return;
                    _ws.send(JSON.stringify({"to":data.FROM, "type":"matchingOK", "list":WebSocketSettings.playerListA, "myRoomKey": WebSocketSettings.mRoomKey}));
                }
                if (data.type == "matchingOK") {
                    if (data.list.length < WebSocketSettings.playerListA.length) {
                        // 自分がホスト
                        WebSocketSettings.host = true;
                        _ws.send(JSON.stringify({"to": data.FROM, "type": "matchingMyHost", "list": WebSocketSettings.playerListA, "myRoomKey": WebSocketSettings.mRoomKey}));
                        WebSocketSettings.roomHost = WebSocketSettings.userId;
                    } else {
                        // お前がホスト
                        WebSocketSettings.host = false;
                        _ws.send(JSON.stringify({"to": data.FROM, "type": "matchingYourHost", "list": WebSocketSettings.playerListA, "roomKey": data.myRoomKey}));
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                        WebSocketSettings.roomHost = data.FROM;
                        getSize();
                    }
                }
                if (data.type == "matchingYourHost") {
                    WebSocketSettings.playerListA = Array.from(new Set(WebSocketSettings.playerListA.concat(data.list)));
                    statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    for (const playerListKey in WebSocketSettings.playerListA) {
                        if (WebSocketSettings.playerListA[playerListKey] == WebSocketSettings.userId) continue;
                        _ws.send(JSON.stringify({"to": WebSocketSettings.playerListA[playerListKey], "type": "matchingPlayerList", "list": WebSocketSettings.playerListA, "roomKey": WebSocketSettings.mRoomKey}));
                    }
                    if (WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) {
                        let waitTime = 10;
                        _wsTimer = setInterval(() => {
                            if (0 > waitTime) {
                                clearInterval(_wsTimer);
                                ws_goRoom();
                                return;
                            }
                            for (const playerListKey in WebSocketSettings.playerListA) {
                                if (WebSocketSettings.playerListA[playerListKey] == WebSocketSettings.userId) continue;
                                _ws.send(JSON.stringify({
                                    "to": WebSocketSettings.playerListA[playerListKey],
                                    "type": "matchingTimer",
                                    "waitTime": waitTime,
                                    "roomKey": WebSocketSettings.mRoomKey
                                }));
                            }
                            statusMessage.string = `まもなく始まります... (${waitTime})`;
                            getSize();
                            waitTime--;
                        }, 1000);
                    }
                    getSize();
                }
                if (data.type == "matchingPlayerList") {
                    WebSocketSettings.playerListA = data.list;
                    if (WebSocketSettings.playerListA.length >= WebSocketSettings.playerMax) {
                        statusMessage.string = `もうしばらくお待ちください... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    } else {
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/${WebSocketSettings.playerMax})`;
                    }
                    getSize();
                }
                if (data.type == "matchingTimer") {
                    statusMessage.string = `まもなく始まります... (${data.waitTime})`;
                    getSize();
                }

                if (data.type == "ping") {
                    WebSocketSettings.last_ping = new Date();
                }

                if (data.type == "goRoomA") {
                    WebSocketSettings.mRoomKey = data.roomKey;
                    ws_goRoom();
                }
                if (data.type == "nextPlayerRefresh") {
                    if (data.FROM !== WebSocketSettings.roomHost) return;
                    nowPiece = data.nowPiece;
                    nowNumber = data.nowNumber;
                    zeroCanPoint = data.zeroCanPoint;
                    zeroIs = data.zeroIs;
                    drawOthelloCanvas();
                    getSize();
                }
                if (data.type == "setOthello") {
                    zeroIs = false;
                    nowPiece[data.panel[0]][data.panel[1]] = nowNumber;
                    setOthelloTurn(data.panel[0], data.panel[1]);
                    nextPlayer();
                }
            }
            if (data.leftHub) {
                if (WebSocketSettings.toGameRoomKey) {
                    WebSocketSettings.closed = true;
                    _ws.close();
                    startNow = false;
                    statusMessage.string = "相手が切断したため終了しました。";
                    statusMessage.color = [255, 0, 0];
                    getSize();
                    return;
                } else {
                    if (WebSocketSettings.host) {
                        if (!WebSocketSettings.playerListA.includes(data.user)) return;
                        WebSocketSettings.playerListA = WebSocketSettings.playerListA.filter(f => f !== data.user);
                        if (_wsTimer) {
                            clearInterval(_wsTimer);
                        }
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length + 1}/${WebSocketSettings.playerMax})`;
                        for (const playerListKey in WebSocketSettings.playerListA) {
                            _ws.send(JSON.stringify({
                                "to": WebSocketSettings.playerListA[playerListKey],
                                "type": "matchingPlayerList",
                                "list": WebSocketSettings.playerListA,
                                "roomKey": WebSocketSettings.mRoomKey
                            }));
                        }
                        getSize();
                    } else {
                        if (WebSocketSettings.roomHost == data.user) {
                            statusMessage.string = "ホストユーザーが抜けたため切断しました。";
                            statusMessage.color = [255, 0, 0];
                            getSize();
                            return;
                        }
                    }
                }
            }
            if (data.error) {
                getSize();
                return;
            }
        };

        //切断
        _ws.onclose = function() {
            if (WebSocketSettings.closed) return;
            statusMessage.string = "サーバーから切断されました。";
            statusMessage.color = [255, 0, 0];
            getSize();
        };
    };

    //エラー発生
    _ws.onerror = function(error) {
        console.error(error);
        statusMessage.string = "エラーが発生しました。";
        statusMessage.color = [255, 0, 0];
        getSize();
    };
};

function ws_startGame () {
    for (let i = 0; i < WebSocketSettings.playerMax; i++) {
        if (WebSocketSettings.playerListA[i]) {
            playerList[i+1] = {
                id: WebSocketSettings.playerListA[i],
                name: playerColorString[i+1],
                cpu: false
            }
            if (WebSocketSettings.userId == WebSocketSettings.playerListA[i]) myNumber = i+1;
        } else {
            playerList[i+1] = {
                id: `CPU${i+1}`,
                name: playerColorString[i+1],
                cpu: true
            }
        }
    }
    statusMessage.color = [255, 255, 255];
    statusMessage.string = "ゲームを開始します。";
    startNow = true;
    nowScreen = "drawOthelloCanvas";
    init();

}

function ws_goRoom () {
    if (WebSocketSettings.host) {
        for (const playerListKey in WebSocketSettings.playerListA) {
            if (WebSocketSettings.playerListA[playerListKey] == WebSocketSettings.userId) continue;
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