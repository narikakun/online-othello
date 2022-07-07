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
    roomHost: null
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
                    _ws.send(JSON.stringify({"joinHub": WebSocketSettings.roomKey}))
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
                        statusMessage.string = `ルームに参加しました。プレイヤーを探しています... (${WebSocketSettings.playerListA.length+1}/4)`;
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
                    if (!WebSocketSettings.host || WebSocketSettings.playerListA.length >= 4) return;
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
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/4)`;
                        WebSocketSettings.roomHost = data.FROM;
                        getSize();
                    }
                }
                if (data.type == "matchingYourHost") {
                    WebSocketSettings.playerListA = Array.from(new Set(WebSocketSettings.playerListA.concat(data.list)));
                    statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/4)`;
                    for (const playerListKey in WebSocketSettings.playerListA) {
                        if (WebSocketSettings.playerListA[playerListKey] == WebSocketSettings.userId) continue;
                        _ws.send(JSON.stringify({"to": WebSocketSettings.playerListA[playerListKey], "type": "matchingPlayerList", "list": WebSocketSettings.playerListA, "roomKey": WebSocketSettings.mRoomKey}));
                    }
                    if (WebSocketSettings.playerListA.length >= 4) {
                        let waitTime = 10;
                        _wsTimer = setInterval(() => {
                            if (0 > waitTime) {
                                clearInterval(_wsTimer);
                                ws_goRoom();
                                return;
                            }
                            for (const playerListKey in WebSocketSettings.playerListA) {
                                if (WebSocketSettings.playerListA[playerListKey] == WebSocketSettings.userId) {
                                    console.log(true);
                                    continue;
                                }
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
                    if (WebSocketSettings.playerListA.length >= 4) {
                        statusMessage.string = `もうしばらくお待ちください... (${WebSocketSettings.playerListA.length}/4)`;
                    } else {
                        statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length}/4)`;
                    }
                    getSize();
                }
                if (data.type == "matchingTimer") {
                    statusMessage.string = `まもなく始まります... (${data.waitTime})`;
                    getSize();
                }
                if ()
                if (data.type == "ping") {
                    WebSocketSettings.last_ping = new Date();
                }

            }
            if (data.leftHub) {
                if (WebSocketSettings.host) {
                    if (!WebSocketSettings.playerListA.includes(data.user)) return;
                    WebSocketSettings.playerListA = WebSocketSettings.playerListA.filter(f => f !== data.user);
                    if (_wsTimer) {
                        clearInterval(_wsTimer);
                    }
                    statusMessage.string = `ほかのプレイヤーの参加を待っています... (${WebSocketSettings.playerListA.length + 1}/4)`;
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
            if (data.error) {
                getSize();
                return;
            }
        };

        //切断
        _ws.onclose = function() {
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
    statusMessage.color = [255, 255, 255];
    statusMessage.string = "ゲームを開始します。";
    startNow = true;
    nowScreen = "drawOthelloCanvas";
    init();
}

function ws_goRoom () {

}