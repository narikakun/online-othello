let wrapper = null;	// キャンバスの親要素
let canvas = null;	// キャンバス
let g = null; // コンテキスト
let $id = function(id){ return document.getElementById(id); }; // DOM取得用
let boardLength = 8; // オセロボードの横・縦の数　（偶数で指定が必須）
let boardOneSize = 0; // オセロボードの一つ当たりの大きさ
let boardPoint = [];
let boardEndPoint = [];
let nowPanel = [null, null]; // 現在の位置
let nowPiece = {}; // 位置とプレイヤー情報
let sizeWH = 0;
let boardWH = 0;
let boardPadding = 0;
let boardPaddingWH = [];
let boardLine = 0;
let canPoint = {};
let zeroCanPoint = {}; // 一つもピースがなくなった場合に置ける場所
let zeroIs = false;
let startNow = false;
let statusMessage = {
    color: [255, 255, 255],
    string: ""
};
let _clicked = false; // 連続クリック対策
let showMessage = {
    color: [255, 255, 255],
    string: "",
    show: false,
    timer: null
}
let roomKeySetIs = false;
let setOthello = [];

let playerColor = { // プレイヤー一覧
    1: [0, 0, 0],
    2: [255, 255, 255],
    3: [255, 0, 0],
    4: [0, 0, 255]
};

let playerList = {
    1: null,
    2: null,
    3: null,
    4: null
}

let playerColorString = ["", "黒", "白", "赤", "青"]

let myNumber = 99;
let nowNumber = 99;

let lastDraw = new Date().getTime();

/*
 初期設定
 */
function init() {
    // 全マスを一度リセット
    for (let i = -1; i < boardLength+1; i++) {
        nowPiece[i] = {};
        canPoint[i] = {};
        zeroCanPoint[i] = {};
        for (let ib= -1; ib < boardLength+1; ib++) {
            nowPiece[i][ib] = {id: null};
            canPoint[i][ib] = null;
            zeroCanPoint[i][ib] = null;
        }
    }
    if (!startNow) return;
    statusMessage.string = "ゲームを開始します。";
    if (WebSocketSettings.host) {
        let boardLengthHalf = Math.floor(boardLength / 2);
        nowPiece[boardLengthHalf - 1][boardLengthHalf - 1] = {id: 1, old: 1}; // 左上
        nowPiece[boardLengthHalf][boardLengthHalf - 1] = {id: 2, old: 2}; // 右上
        if (playerList[3] && playerList[4]) {
            nowPiece[boardLengthHalf - 1][boardLengthHalf] = {id: 3, old: 3}; // 左下
            nowPiece[boardLengthHalf][boardLengthHalf] = {id: 4, old: 4}; // 右下
            nowPiece[boardLengthHalf + 1][boardLengthHalf - 1] = {id: 4, old: 4}; // 右
            nowPiece[boardLengthHalf][boardLengthHalf + 1] = {id: 3, old:3}; // 下
            nowPiece[boardLengthHalf - 2][boardLengthHalf] = {id: 1, old: 1}; // 左
            nowPiece[boardLengthHalf - 1][boardLengthHalf - 2] = {id: 2, old: 2}; // 上
        } else {
            nowPiece[boardLengthHalf - 1][boardLengthHalf] = {id: 2, old: 2};
            nowPiece[boardLengthHalf][boardLengthHalf] = {id: 1, old: 1};
        }
    }
    nextPlayer();
}

/*
 キャンバスのサイズをウインドウに合わせて変更
 */
function getSize(){
    // キャンバスのサイズを再設定
    canvas.width = wrapper.offsetWidth;
    canvas.height =  wrapper.offsetHeight;
    sizeWH = canvas.width; // 基準にする大きさ
    if (canvas.height < canvas.width) sizeWH = canvas.height;
    boardWH = sizeWH-(sizeWH/10);
    boardPadding = sizeWH/90;
    boardLine = sizeWH/200;
    boardPaddingWH = boardWH-(boardPadding*2) - (boardLength*boardLine);
    boardOneSize = (boardPaddingWH / boardLength);
}

/*
 リサイズ時
 */
window.addEventListener("resize", function(){
    getSize();
});

/*
 起動処理
 */
window.addEventListener("load", function(){
    // キャンバスの親要素情報取得（親要素が無いとキャンバスのサイズが画面いっぱいに表示できないため）
    wrapper = $id("wrapper");
    // キャンバス情報取得
    canvas = $id("canvas");
    g = canvas.getContext("2d");
    canvas.addEventListener("mousemove", canvasMouseMove);
    canvas.addEventListener("click", canvasMouseClick);
    // ボッチプレイ用
    if (getParam("botti")) {
        botti = true;
    } else {
        // クッキーからニックネーム
        let nickNameC = getParam("nickname");
        if (nickNameC) {
            WebSocketSettings.nickname = nickNameC.substring(0, 15);
        } else {
            let cookies = document.cookie;
            let cookiesArray = cookies.split(';');

            for (let c of cookiesArray) {
                let cArray = c.split('=');
                if (cArray[0] == 'nickname') {
                    WebSocketSettings.nickname = cArray[1].substring(0, 15);
                }
            }
        }
        if (!WebSocketSettings.nickname) {
            let inputNickname = window.prompt("ゲーム内で利用するニックネームを設定できます。（そのままスキップも可能です。）", "");
            if (inputNickname) {
                WebSocketSettings.nickname = inputNickname.substring(0, 15);
                document.cookie = "nickname=" + inputNickname.substring(0, 15);
            }
        }
    }
    // 初期設定
    getSize();
    init();
    analyticsGoGo();
    if (!botti) {
        // ルームキーを初期で設定できるように（GETパラメータ）
        let roomKeyC = getParam("roomKey");
        if (roomKeyC) {
            WebSocketSettings.roomKey = roomKeyC;
            websocketStart();
        }
    } else {
        // ボッチプレイ用
        startBotti();
    }
});

/*
 ぼっちもーどに行く
 */
function startBotti () {
    // ボッチプレイ用
    botti = true;
    playerList = {
        "1": {
            "id": WebSocketSettings.userId,
            "name": "自分 (黒)",
            "cpu": false
        },
        "2": {
            "id": "1234",
            "name": "CPU (白)",
            "cpu": true
        },
        "3": null,
        "4": null
    };
    roomKeySetIs = true;
    WebSocketSettings.host = true;
    WebSocketSettings.roomHost = WebSocketSettings.userId;
    WebSocketSettings.toGameRoomKey = WebSocketSettings.mRoomKey;
    startNow = true;
    playerDefaultTimerCount = 30;
    WebSocketSettings.started = true;
    WebSocketSettings.playerMax = 2;
    WebSocketSettings.trueIs = true;
    WebSocketSettings.playerListA = [WebSocketSettings.userId, "1234"];
    WebSocketSettings.playerListRoom = [WebSocketSettings.userId];
    myNumber = 1;
    startDataGoGoPanic();
    init();
}
/*
 33msごとに描写更新
 */
setInterval(() => {
    drawOthelloCanvas();
}, 33);

/*
 アクセス統計を取る
 */
function analyticsGoGo() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://gameapi.nakn.jp/othello/analytics/?accessCounter=1', true);
    xhr.send();
}

let playerDefaultTimerCount = 15;
/*
 キャンバスクリック時の動作
 */
let lastCanvasClick = new Date().getTime();
function canvasMouseClick (e, cpu = false, panel = null)
{
    if (!WebSocketSettings.trueIs) return;
    let _panel = panel?panel:nowPanel;
    if (startNow) {
        if (_panel[0] == null || _panel[1] == null) {
            _clicked = false;
            return;
        }
        if (!cpu) {
            if (_clicked) return;
            _clicked = true;
            clearInterval(clicked_interval);
            _clicked = true;
            clicked_interval = setInterval(() => _clicked = false, 1000);
            if (nowNumber !== myNumber) return;
            _clicked = true;
        }
        let nowCanvasClickSet = new Date().getTime();
        if ((nowCanvasClickSet-lastCanvasClick)<1000) return;
        lastCanvasClick = nowCanvasClickSet;
        if (zeroIs && !zeroCanPoint[_panel[0]][_panel[1]]) {
            _clicked = false;
            return;
        } else if (!zeroIs && !canPoint[_panel[0]][_panel[1]]) {
            _clicked = false;
            return;
        }
        loopCount = 0;
        if (WebSocketSettings.host) {
            nowPiece[_panel[0]][_panel[1]] = {id: nowNumber, zeroIs: zeroIs};
            zeroIs = false;
            setOthelloTurn(_panel[0], _panel[1]);
            setOthello.push({
                panel: _panel,
                color: [255, 255, 0, 1]
            });
            statusMessage.string = `${playerColorString[nowNumber]}が設置しました。`;
            if (!botti) _ws.send(JSON.stringify({
                "toH": WebSocketSettings.toGameRoomKey,
                "type": "setOthelloEvery",
                "roomKey": WebSocketSettings.toGameRoomKey,
                "setUser": nowNumber,
                "panel": _panel,
                "setOthello": setOthello
            }));
            clearInterval(_playerTimer);
            playerTimerCount = playerDefaultTimerCount;
            nextPlayer();
        } else {
            if (!botti) _ws.send(JSON.stringify({
                "to": WebSocketSettings.roomHost,
                "type": "setOthello",
                "roomKey": WebSocketSettings.toGameRoomKey,
                "panel": _panel
            }));
            setOthello.push({
                panel: _panel,
                color: [255, 255, 0, 1]
            });
            statusMessage.string = `${playerColorString[nowNumber]}が設置しました。`;
            if (!botti) _ws.send(JSON.stringify({
                "toH": WebSocketSettings.toGameRoomKey,
                "type": "setOthelloEvery",
                "roomKey": WebSocketSettings.toGameRoomKey,
                "setUser": nowNumber,
                "panel": _panel
            }));
        }
    } else {
        _clicked = true;
        if (_panel[0] == null || _panel[1] == null) {
            _clicked = false;
            return;
        }
        if (_panel[0] === 2 && _panel[1] === 4) roomKeyUpDown(0, true);
        if (_panel[0] === 2 && _panel[1] === 6) roomKeyUpDown(0, false);
        if (_panel[0] === 3 && _panel[1] === 4) roomKeyUpDown(1, true);
        if (_panel[0] === 3 && _panel[1] === 6) roomKeyUpDown(1, false);
        if (_panel[0] === 4 && _panel[1] === 4) roomKeyUpDown(2, true);
        if (_panel[0] === 4 && _panel[1] === 6) roomKeyUpDown(2, false);
        if (_panel[0] === 5 && _panel[1] === 4) roomKeyUpDown(3, true);
        if (_panel[0] === 5 && _panel[1] === 6) roomKeyUpDown(3, false);
        if (_panel[0] === 6 && _panel[1] === 5) websocketStart();
        if ((_panel[0] === 3 && _panel[1] === 5) || (_panel[0] === 4 && _panel[1] === 5)) {
            if (WebSocketSettings.connected && WebSocketSettings.playerListA.length > 1 && !WebSocketSettings.started) {
                WebSocketSettings.started = true;
                if (WebSocketSettings.playerListA.length < 3) WebSocketSettings.playerMax = 2;
                startCount();
            }
        }
        if ((_panel[0] >= 2 && _panel[0] <= 5) && (_panel[1] === 6)) {
            if (WebSocketSettings.isFinish) location.reload();
        }
        if (_panel[0] === 6 && _panel[1] === 6) {
            startBotti();
        }
        if (_panel[0] === 6 && _panel[1] === 4) {
            window.open( './asobikata.png', null, 'left=200,top=200' );
        }
        _clicked = false;
    }
}

/*
 ルームキーの操作内部
 */
function roomKeyUpDown (l, up) {
    let roomKeySplit = WebSocketSettings.roomKey.split("");
    let lInt = Number(roomKeySplit[l]);
    if (up) {
        lInt++;
    } else {
        lInt--;
    }
    if (lInt > 9) {
        lInt = 9;
    } else if (lInt < 0) {
        lInt = 0;
    }
    roomKeySplit[l] = String(lInt);
    WebSocketSettings.roomKey = roomKeySplit.join("");
}
/*
 誰のターンかどうかのメッセージ
 */
function showPlayerMessage (type = "next") {
    if (!playerList[nowNumber]) return;
    switch (type) {
        case "next":
            if (myNumber === nowNumber) {
                showMessage.string = "あなたのターンです。";
            } else {
                showMessage.string = `${playerList[nowNumber].name}のターンです。`;
            }
            break;
        case "skip":
            if (myNumber === nowNumber) {
                showMessage.string = "あなたはスキップされます。";
            } else {
                showMessage.string = `${playerList[nowNumber].name}がスキップです。`;
            }
            break;
    }
    showMessage.show = true;
    _clicked = true;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(()=>{
        showMessage.show = false;
        _clicked = false;
        if (type === "skip") {
            nextPlayer();
        } else if (type === "next") {
            if (WebSocketSettings.host) playerTimer();
            if (playerList[nowNumber].cpu) cpGo();
        }
    }, 2000);
}

/*
 プレイヤーの時間制限
 */
let _playerTimer = null;
let playerTimerCount = playerDefaultTimerCount;
function playerTimer () {
    clearInterval(_playerTimer);
    if (!startNow) return;
    playerTimerCount = playerDefaultTimerCount;
    _playerTimer = setInterval(() => {
        if (0 > playerTimerCount) {
            clearInterval(_playerTimer);
            cpGo();
            return;
        }
        if (!botti) _ws.send(JSON.stringify({
            "toH": WebSocketSettings.toGameRoomKey,
            "type": "playerTimerCount",
            "playerTimerCount": playerTimerCount,
            "roomKey": WebSocketSettings.mRoomKey
        }));
        playerTimerCount--;
    }, 1000);
}

let loopCount = 0;
/*
 次のプレイヤーに回す
 */
function nextPlayer () {
    nowNumber++;
    zeroIs = false;
    if ((playerList[3]&&playerList[4])?nowNumber > 4:nowNumber > 2) {
        nowNumber = 1;
    }
    if (WebSocketSettings.isFinish) return;
    _clicked = true;
    canPointSet();
    let canPointCount = 0;
    for (const canPointKey in canPoint) {
        for (const canPointKeyAs in canPoint[canPointKey]) {
            if (canPoint[canPointKey][canPointKeyAs]) canPointCount++;
        }
    }
    if (canPointCount === 0) {
        let nowPieceCount = 0;
        let nowPieceNullCount = 0;
        for (let i = 0; i < boardLength; i++) {
            for (let i2 = 0; i2 < boardLength; i2++) {
                if (nowPiece[i][i2].id === nowNumber) nowPieceCount++;
                if (nowPiece[i][i2].id == null) nowPieceNullCount++;
            }
        }
        if (nowPieceNullCount === 0) {
            WebSocketSettings.isFinish = true;
            boardLength = 8;
            getSize();
            finishDataGoGoPanic();
            if (!botti) _ws.send(JSON.stringify({
                "toH": WebSocketSettings.toGameRoomKey,
                "type": "finish",
                "roomKey": WebSocketSettings.toGameRoomKey
            }));
            nowNumber = 5;
            setTimeout(()=>{
                WebSocketSettings.closed = true;
                startNow = false;
                if (!botti) _ws.close();
            }, 2000);
        } else if (nowPieceCount === 0) {
            // 一つもピースがなくなった場合
            zeroIs = true;
            for (let i = 0; i < boardLength; i++) {
                zeroCanPoint[i] = {};
                for (let ib = 0; ib < boardLength; ib++) {
                    if (nowPiece[i][ib].id) continue;
                    for (let d = -1; d <= 1; d++) {
                        for (let e = -1; e <= 1; e++) {
                            if (nowPiece[i + d][ib + e].id !== null) zeroCanPoint[i][ib] = true;
                        }
                    }
                }
            }
        } else {
            if (loopCount > 5) {
                WebSocketSettings.isFinish = true;
                boardLength = 8;
                getSize();
                finishDataGoGoPanic();
                if (!botti) _ws.send(JSON.stringify({
                    "toH": WebSocketSettings.toGameRoomKey,
                    "type": "finish",
                    "roomKey": WebSocketSettings.toGameRoomKey
                }));
                setTimeout(()=>{
                    WebSocketSettings.closed = true;
                    startNow = false;
                    if (!botti) _ws.close();
                }, 2000);
                return;
            }
            // スキップ
            loopCount++;
            statusMessage.string = `${playerColorString[nowNumber]}がスキップされます。`;
            if (!botti) _ws.send(JSON.stringify({
                "toH": WebSocketSettings.toGameRoomKey,
                "type": "skipPlayer",
                "roomKey": WebSocketSettings.toGameRoomKey,
                "nowNumber": nowNumber,
                "nowPiece": json_gZip(nowPiece),
                "zeroCanPoint": json_gZip(zeroCanPoint),
                "zeroIs": zeroIs,
                "canPoint": json_gZip(canPoint)
            }));
            showPlayerMessage("skip");
            return;
        }
    }
    if (WebSocketSettings.host) {
        if (!botti) _ws.send(JSON.stringify({
            "toH": WebSocketSettings.toGameRoomKey,
            "type": "nextPlayerRefresh",
            "roomKey": WebSocketSettings.toGameRoomKey,
            "nowNumber": nowNumber,
            "nowPiece": json_gZip(nowPiece),
            "zeroCanPoint": json_gZip(zeroCanPoint),
            "zeroIs": zeroIs,
            "canPoint": json_gZip(canPoint),
            "setOthello": setOthello
        }));
        showPlayerMessage();
    }
    _clicked = false;
}

/*
 終わった時の動作
 */
let finishA = 0;
let finishB = false;
let finishC = false;
function gameFinish () {
    if (finishA < 20) {
        finishA++;
        finishB = false;
    } else {
        if (!finishC) finishB = true;
    }
    if (_playerTimer) clearInterval(_playerTimer);
    statusMessage.string = `ゲームが終了しました。`;
    // 背景
    g.beginPath();
    g.fillStyle = "rgba(0, 0, 0, 0.7)";
    g.fillRect(boardPoint[0] + (sizeWH / 30), boardPoint[1] + (sizeWH / 30), (boardEndPoint[0] - boardPoint[0]) - ((sizeWH / 30)*2), (boardEndPoint[1] - boardPoint[1]) - ((sizeWH / 30)*2));
    // 結果画面（テキスト）
    g.beginPath();
    g.font = `${sizeWH / 20}pt Arial`;
    g.fillStyle = `rgba(255, 255, 255)`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("ゲーム結果", boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (1.5 * boardOneSize));
    // ピース数カウント
    let playerPiece = {1:0,2:0,3:0,4:0};
    for (let i = 0; i < WebSocketSettings.gameBoardLength; i++) {
        for (let i2 = 0; i2 < WebSocketSettings.gameBoardLength; i2++) {
            if (nowPiece[i][i2].id == null) continue;
            playerPiece[nowPiece[i][i2].id]++;
        }
    }
    if (finishB && playerPiece[myNumber]) {
        finishC = true;
        finishB = false;
        let groupId = getParam("groupId");
        let groupPassword = getParam("groupPassword");
        let userId = getParam("userId");
        if (groupId && groupPassword && userId) {
            let xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://gameapi.nakn.jp/othello/api/?putData=1', true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({
                "userId": userId,
                "groupId": groupId,
                "groupPassword": groupPassword,
                "points": playerPiece[myNumber]
            }));
        }
    }
    let pieceArray = Object.keys(playerPiece).map((k)=>({ key: k, value: playerPiece[k] }));
    pieceArray.sort((a, b) => b.value - a.value);
    g.font = `${sizeWH / 30}pt Arial`;
    for (let i = 0; i < 4; i++) {
        if (pieceArray[i].value!==0) g.fillText(`${i+1}位: ${playerColorString[pieceArray[i].key]} => ${pieceArray[i].value}個 (${playerList[pieceArray[i].key].id===WebSocketSettings.userId?"あなた":playerList[pieceArray[i].key].name})`, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + ((2.5 + i) * boardOneSize), (boardEndPoint[0] - boardPoint[0]) - ((sizeWH / 30)*2));
    }
    if (!startNow) {
        // もう一度遊ぶボタン
        g.beginPath();
        g.fillStyle = "rgba(255, 255, 255)";
        g.fillRect(boardPoint[0] + (2 * boardOneSize) + (boardLine * 2), boardPoint[1] + (6 * boardOneSize) + (boardLine * 6), (boardOneSize * 4) + boardLine * 3, boardOneSize);
        // もう一度遊ぶ文字
        g.beginPath();
        g.font = `${sizeWH / 25}pt Arial`;
        g.fillStyle = `rgba(0, 0, 0)`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("もう一度遊ぶ", boardPoint[0] + (4 * boardOneSize) + (boardLine * 4), boardPoint[1] + (6.5 * boardOneSize) + (boardLine * 7));
    }
}


/*
 キャンバス上でのマウスカーソル移動時の処理
 */
function canvasMouseMove(e) {
    let rect = e.target.getBoundingClientRect()
    let _nowPanel = othelloXY(e.clientX - rect.left, e.clientY - rect.top);
    if (_nowPanel[0] >= 0 && _nowPanel[1] >= 0 && _nowPanel[0] < boardLength && _nowPanel[1] < boardLength) {
        nowPanel = _nowPanel;
    } else {
        nowPanel = [null, null];
    }
}

/*
 座標から現在位置を求める
 */
function othelloXY (x, y) {
    return [Math.floor((x - boardPoint[0]) / ((boardEndPoint[0] - boardPoint[0]) / boardLength)), Math.floor((y - boardPoint[1]) / ((boardEndPoint[1] - boardPoint[1]) / boardLength))];
}

/*
 置ける場所を考える
 */

function setCanDoOthello (x, y) {
    if (x == null || y == null) return false;
    if (nowPiece[x][y].id == nowNumber && nowPiece[x][y].zeroIs) {
        nowPiece[x][y].zeroIs = false;
        console.log(nowPiece[x][y]);
    }
    if (nowPiece[x][y].id == null) {
        // 右横部分（現在マスから右・横を確認）
        for (let i = x+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[i][y].id == null || ((nowPiece[i][y].id === nowNumber) && (x+1===i)) || nowPiece[i][y].zeroIs) break;
            if (nowPiece[i][y].id !== nowNumber && nowPiece[i][y].id !== null) continue;
            if (nowPiece[i][y].id === nowNumber) return true;
        }

        // 左下方向（現在マスから左下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i].id == null || ((nowPiece[x-(y-i)][i].id === nowNumber) && (y+1===i)) || nowPiece[x-(y-i)][i].zeroIs) break;
            if (nowPiece[x-(y-i)][i].id !== nowNumber && nowPiece[x-(y-i)][i].id !== null) continue;
            if (nowPiece[x-(y-i)][i].id === nowNumber) return true;
        }

        // 下方向（現在マスから下・縦を確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x][i].id == null || ((nowPiece[x][i].id === nowNumber) && (y+1===i)) || nowPiece[x][i].zeroIs) break;
            if (nowPiece[x][i].id !== nowNumber && nowPiece[x][i].id !== null) continue;
            if (nowPiece[x][i].id === nowNumber) return true;
        }

        // 右下方向（現在マスから右下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x+(y-i)][i].id == null || ((nowPiece[x+(y-i)][i].id === nowNumber) && (y+1===i)) || nowPiece[x+(y-i)][i].zeroIs) break;
            if (nowPiece[x+(y-i)][i].id !== nowNumber && nowPiece[x+(y-i)][i].id !== null) continue;
            if (nowPiece[x+(y-i)][i].id === nowNumber) return true;
        }

        // 左横方向（現在マスから左・横を確認）
        for (let i = x-1; i >= -1; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[i][y].id == null || ((nowPiece[i][y].id === nowNumber) && (x-1===i)) || nowPiece[i][y].zeroIs) break;
            if (nowPiece[i][y].id !== nowNumber && nowPiece[i][y].id !== null) continue;
            if (nowPiece[i][y].id === nowNumber) return true;
        }

        // 上方向（現在マスから上・縦を確認）
        for (let i = y-1; i >= -1; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x][i].id == null || ((nowPiece[x][i].id === nowNumber) && (y-1===i)) || nowPiece[x][i].zeroIs) break;
            if (nowPiece[x][i].id !== nowNumber && nowPiece[x][i].id !== null) continue;
            if (nowPiece[x][i].id === nowNumber) return true;
        }

        // 左上方向（現在マスから左上・斜めを確認）
        for (let i = y-1; i >= 0; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i].id == null || ((nowPiece[x-(y-i)][i].id === nowNumber) && (y-1===i)) || nowPiece[x-(y-i)][i].zeroIs) break;
            if (nowPiece[x-(y-i)][i].id !== nowNumber && nowPiece[x-(y-i)][i].id !== null) continue;
            if (nowPiece[x-(y-i)][i].id === nowNumber) return true;
        }

        // 右上方向（現在マスから右上・斜めを確認） 1 6
        for (let i = y-1; i >= 0; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x+(y-i)][i].id == null || ((nowPiece[x+(y-i)][i].id === nowNumber) && (y-1===i)) || nowPiece[x+(y-i)][i].zeroIs) break;
            if (nowPiece[x+(y-i)][i].id !== nowNumber && nowPiece[x+(y-i)][i].id !== null) continue;
            if (nowPiece[x+(y-i)][i].id === nowNumber) return true;
        }

    }
    return false;
}

/*
 置いたときに裏返す処理
 */
function setOthelloTurn (x, y) {
    if (x == null || y == null) return false;
    // 右方向
    let rightCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y].id == null || nowPiece[i][y].zeroIs) break;
        if (nowPiece[i][y].id !== nowNumber) continue;
        if (x!==i) {
            rightCount = i;
            break;
        }
    }
    if (rightCount !== null) {
        for (let i = x; i <= rightCount; i++) {
            if (rightCount-x>=2) setWPiece(x,y,i,y,nowNumber);
        }
    }

    // 下方向
    let downCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x][i].id == null || nowPiece[x][i].zeroIs) break;
        if (nowPiece[x][i].id !== nowNumber) continue;
        if (y!==i) {
            downCount = i;
            break;
        }
    }
    if (downCount !== null) {
        for (let i = y; i <= downCount; i++) {
            if (downCount-y>=2) setWPiece(x,y,x, i,nowNumber);
        }
    }

    // 左方向
    let leftCount = null;
    for (let i = x; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y].id == null || nowPiece[i][y].zeroIs) break;
        if (nowPiece[i][y].id !== nowNumber) continue;
        if (x!==i) {
            leftCount = i;
            break;
        }
    }
    if (leftCount !== null) {
        for (let i = leftCount; i <= x; i++) {
            if (x-leftCount>=2) setWPiece(x,y,i,y,nowNumber);
        }
    }

    // 上方向
    let upCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x][i].id == null || nowPiece[x][i].zeroIs) break;
        if (nowPiece[x][i].id !== nowNumber) continue;
        if (y!==i) {
            upCount = i;
            break;
        }
    }
    if (upCount !== null) {
        for (let i = upCount; i <= y; i++) {
            if (y-upCount>=2) setWPiece(x,y,x,i, nowNumber);
        }
    }

    // 右上方向
    let rightUpCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y+(x-i)].id == null || nowPiece[i][y+(x-i)].zeroIs) break;
        if (nowPiece[i][y+(x-i)].id !== nowNumber) continue;
        if (x!==i) {
            rightUpCount = i;
            break;
        }
    }
    if (rightUpCount !== null) {
        for (let i = x; i <= rightUpCount; i++) {
            if (rightUpCount-x>=2) setWPiece(x,y,i, y+(x-i), nowNumber);
        }
    }

    // 左下方向
    let leftDownCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x+(y-i)][i].id == null || nowPiece[x+(y-i)][i].zeroIs) break;
        if (nowPiece[x+(y-i)][i].id !== nowNumber) continue;
        if (y!==i) {
            leftDownCount = i;
            break;
        }
    }
    if (leftDownCount !== null) {
        for (let i = y; i <= leftDownCount; i++) {
            if (leftDownCount-y>=2) setWPiece(x,y,x+(y-i),i, nowNumber);
        }
    }

    // 右下方向
    let rightDownCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y-(x-i)].id == null || nowPiece[i][y-(x-i)].zeroIs) break;
        if (nowPiece[i][y-(x-i)].id !== nowNumber) continue;
        if (x!==i) {
            rightDownCount = i;
            break;
        }
    }
    if (rightDownCount !== null) {
        for (let i = x; i <= rightDownCount; i++) {
            if (rightDownCount-x>=2) setWPiece(x,y,i, y-(x-i), nowNumber);
        }
    }

    // 左上方向
    let leftUpCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x-(y-i)][i].id == null || nowPiece[x-(y-i)][i].zeroIs) break;
        if (nowPiece[x-(y-i)][i].id !== nowNumber) continue;
        if (y!==i) {
            leftUpCount = i;
            break;
        }
    }
    if (leftUpCount !== null) {
        for (let i = leftUpCount; i <= y; i++) {
            if (y-leftUpCount>=2) setWPiece(x,y,x-(y-i), i, nowNumber);
        }
    }
}

/*
 以前と違うピースの色
 */
function setWPiece (sX, sY, x, y, number) {
    if (!(sX == x && sY == y) && number !== nowPiece[x][y].id) {
        nowPiece[x][y].r = 1;
    }
    nowPiece[x][y].old = nowPiece[x][y].id;
    nowPiece[x][y].id = number;
    if ((sX == x && sY == y)) {
        setOthello.push({
            panel: [x, y],
            color: [255, 255, 0, 1]
        });
    }
}

/*
 置けるマスをCanPointとして保存
 */
function canPointSet () {
    for (let i = 0; i < boardLength; i++) {
        canPoint[i] = {};
        for (let ib= 0; ib < boardLength; ib++) {
            canPoint[i][ib] = setCanDoOthello(i, ib);
        }
    }
}

/*
 オセロのキャンバスを作る
 */
function drawOthelloCanvas () {
    // キャンバスをリセット（黒色）
    g.beginPath();
    g.fillStyle = "rgba(0, 0, 0)";
    g.fillRect(0, 0, canvas.width, canvas.height);
    // バージョン情報
    g.beginPath();
    g.font = `${sizeWH / 90}pt Arial`;
    g.fillStyle = `rgba(80,80,80)`;
    g.textAlign = "left";
    g.textBaseline = "top";
    g.fillText(`Ver.${WebSocketSettings.version}`, 10,10);5
    // 背景を描写
    g.beginPath ();
    g.fillStyle = "rgba(19, 19, 19)";
    g.fillRect((canvas.width/2)-(boardWH/2)-boardPadding, (canvas.height/2)-(boardWH/2)-boardPadding, boardWH, boardWH);
    boardPoint = [(canvas.width/2)-(boardWH/2)+boardLine, (canvas.height/2)-(boardWH/2)+boardLine];
    boardEndPoint = [boardPoint[0] + (boardLength * boardOneSize) + ((boardLine) * boardLength), boardPoint[1] + (boardLength * boardOneSize) + ((boardLine) * boardLength)];
    let nowX = 0;
    let nowY = 0;
    for (let i = 0; i < boardLength*boardLength; i++) {
        if (nowX >= boardLength) {
            nowY++;
            nowX = 0;
        }
        if (!nowPiece[nowX]) continue;
        g.fillStyle = "rgb(56, 118, 29)";
        g.fillRect(boardPoint[0] + (nowX * boardOneSize) + (boardLine*nowX), boardPoint[1] + (nowY * boardOneSize) + (boardLine*nowY), boardOneSize, boardOneSize);
        let pieceXyR = [boardPoint[0] + ((nowX+1) * boardOneSize) + (boardLine*nowX) - (boardOneSize/2), boardPoint[1] + ((nowY+1) * boardOneSize) + (boardLine*nowY) - (boardOneSize/2), boardOneSize/2.3];
        let setOthelloFind = setOthello.findIndex(f => f.panel[0] === nowX && f.panel[1] === nowY);
        if (setOthelloFind !== -1) {
            g.beginPath();
            g.fillStyle = `rgba(${setOthello[setOthelloFind].color[0]}, ${setOthello[setOthelloFind].color[1]}, ${setOthello[setOthelloFind].color[2]}, ${setOthello[setOthelloFind].color[3]})`;
            g.fillRect(boardPoint[0] + (nowX * boardOneSize) + (boardLine * nowX), boardPoint[1] + (nowY * boardOneSize) + (boardLine * nowY), boardOneSize, boardOneSize)
            setOthello[setOthelloFind].color[3] = setOthello[setOthelloFind].color[3]-0.1;
            if (setOthello[setOthelloFind].color[3] <= 0) setOthello = setOthello.filter(f => f.panel[0] !== nowX && f.panel[1] !== nowY);
        }
        if (!WebSocketSettings.isFinish || WebSocketSettings.gameBoardLength == 8) {
            if (nowX === nowPanel[0] && nowY === nowPanel[1] && nowPiece[nowX][nowY].id == null && nowNumber === myNumber) {
                gContextSetPiece(pieceXyR);
                g.fillStyle = `rgba(${playerColor[nowNumber]}, 0.6)`;
                g.fill();
            } else if (nowPiece[nowX][nowY].id !== null) {
                g.fillStyle = `rgba(${playerColor[nowPiece[nowX][nowY].id]})`;
                let r = 1;
                if (nowPiece[nowX][nowY].r) {
                    let rA = nowPiece[nowX][nowY].rA ? nowPiece[nowX][nowY].rA : 1;
                    if (nowPiece[nowX][nowY].r <= 8) {
                        nowPiece[nowX][nowY].r = nowPiece[nowX][nowY].r + 0.3;
                        if (nowPiece[nowX][nowY].r >= 3 && nowPiece[nowX][nowY].r <= 6) {
                            nowPiece[nowX][nowY].r = nowPiece[nowX][nowY].r + 0.3;
                        }
                        if (nowPiece[nowX][nowY].r < 4) {
                            r = nowPiece[nowX][nowY].r;
                            if (rA > 0) nowPiece[nowX][nowY].rA = rA - 0.1;
                            g.fillStyle = `rgba(${playerColor[nowPiece[nowX][nowY].old]}, ${rA})`;
                        } else {
                            r = 8 - nowPiece[nowX][nowY].r;
                            if (rA < 1) nowPiece[nowX][nowY].rA = rA + 0.1;
                            g.fillStyle = `rgba(${playerColor[nowPiece[nowX][nowY].id]}, ${rA})`;
                        }
                    }
                }
                if (r < 1) r = 1;
                gContextSetPiece(pieceXyR, r);
                g.fill();
            } else if (canPoint[nowX][nowY]) {
                gContextSetPiece(pieceXyR);
                g.fillStyle = `rgba(${playerColor[nowNumber]}, 0.2)`;
                g.fill();
            } else if (zeroCanPoint[nowX][nowY] && zeroIs) {
                gContextSetPiece(pieceXyR);
                g.fillStyle = "rgba(255,255,0,0.2)";
                g.fill();
            }
        }
        nowX++;
    }
    // 残り時間
    g.beginPath ();
    g.font = `${sizeWH/50}pt Arial`;
    g.fillStyle = `rgba(255,255,255)`;
    g.textAlign = "right";
    g.textBaseline = "top";
    let timeString = playerTimerCount>0?playerTimerCount:"時間切れ";
    let timeStringW = g.measureText(timeString).width;
    g.fillText(timeString, boardEndPoint[0], boardEndPoint[1] + sizeWH / 200);
    if (WebSocketSettings.isFinish) {
        gameFinish();
    } else if (startNow) {
        // ボードの下に文字を書く
        g.beginPath();
        g.font = `${sizeWH / 50}pt Arial`;
        g.fillStyle = 'rgba(255, 255, 255)';
        g.textAlign = "left";
        g.textBaseline = "top";
        let playerListPieceCount = {
            1: 0,
            2: 0,
            3: 0,
            4: 0
        };
        for (const nowPieceKey in nowPiece) {
            for (const nowPieceKeyAs in nowPiece[nowPieceKey]) {
                if (!nowPiece[nowPieceKey][nowPieceKeyAs].id) continue;
                playerListPieceCount[nowPiece[nowPieceKey][nowPieceKeyAs].id]++;
            }
        }
        let pieceCountString = "";
        for (const playerListPieceCountKey in playerListPieceCount) {
            if (!playerListPieceCount[playerListPieceCountKey]) continue;
            if (pieceCountString !== "") pieceCountString += " | ";
            pieceCountString += `${playerColorString[playerListPieceCountKey]}: ${playerListPieceCount[playerListPieceCountKey]}`;
        }
        if (playerList[nowNumber]) {
            let footerText = `参加人数: ${WebSocketSettings.playerListA.length}人 | 今のターン: ${playerList[nowNumber].name} | あなた: ${playerColorString[myNumber]}`;
            g.fillText(footerText, boardPoint[0], boardEndPoint[1] + sizeWH / 200, boardEndPoint[0]-boardPoint[0]-timeStringW);
        }
        g.fillText(pieceCountString, boardPoint[0], boardEndPoint[1] + (sizeWH / 50) + ((sizeWH / 200)*2.5), boardEndPoint[0]-boardPoint[0]);
    } else if (WebSocketSettings.trueIs) {
        // タイトル画面
        showTitleScreen();
    }
    // fps描写
    let nowTimestamp = new Date().getTime();
    let fps = (1000 / (nowTimestamp - lastDraw)).toPrecision(3);
    lastDraw = nowTimestamp;
    g.beginPath ();
    g.font = `${sizeWH/50}pt Arial`;
    g.fillStyle = `rgba(255,255,255)`;
    g.textAlign = "right";
    g.textBaseline = "bottom";
    g.fillText(fps, boardEndPoint[0], boardPoint[1]-(sizeWH/50));
    // ボード上にメッセージを置く
    g.beginPath ();
    g.font = `${sizeWH/50}pt Arial`;
    g.fillStyle = `rgba(${statusMessage.color[0]}, ${statusMessage.color[1]}, ${statusMessage.color[2]})`;
    g.textAlign = "left";
    g.textBaseline = "bottom";
    g.fillText(statusMessage.string, boardPoint[0], boardPoint[1]-(sizeWH/50), boardEndPoint[0]-boardPoint[0]);
    // 画面中央メッセージの描写
    if (showMessage.show) {
        // メッセージ背景
        g.beginPath ();
        g.fillStyle = "rgba(68, 68, 68, 0.7)";
        g.fillRect(boardPoint[0]-(sizeWH/30), ((boardEndPoint[1]-boardPoint[1])/2)-(sizeWH/10), (boardEndPoint[0]-boardPoint[0])+((sizeWH/30)*2), ((sizeWH/10)*2));
        // メッセージを描写
        g.beginPath();
        g.font = `${sizeWH / 20}pt Arial`;
        g.fillStyle = `rgba(${showMessage.color[0]}, ${showMessage.color[1]}, ${showMessage.color[2]})`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(showMessage.string, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), (boardEndPoint[1]-boardPoint[1])/2, boardEndPoint[0]-boardPoint[0]);
    }
    WebSocketSettings.trueIs = true;
}

/*
 タイトル画面
 */
function showTitleScreen () {
    // タイトル文字
    g.beginPath();
    g.font = `${sizeWH / 15}pt Arial`;
    g.fillStyle = `rgba(255,255,255)`;
    g.textAlign = "left";
    g.textBaseline = "top";
    let titleA = "オセロ".split("");
    for (let i = 0; i < titleA.length; i++) {
        g.fillText(titleA[i], boardPoint[0] + ((i+1) * boardOneSize) + (boardLine*i) + (boardOneSize/8), boardPoint[1] + boardOneSize + (boardOneSize/5));
    }
    let titleB = "ゲーム".split("");
    for (let i = 0; i < titleB.length; i++) {
        g.fillText(titleB[i], boardPoint[0] + ((i+4) * boardOneSize) + (boardLine*(i+3)) + (boardOneSize/8), boardPoint[1] + (2 * boardOneSize) + boardLine + (boardOneSize/5));
    }
    // マッチング背景
    g.beginPath();
    g.fillStyle = "rgba(0, 0, 0, 0.7)";
    g.fillRect(boardPoint[0] + (sizeWH / 30), boardPoint[1] + (sizeWH / 2.6), (boardEndPoint[0] - boardPoint[0]) - ((sizeWH / 30) * 2), ((sizeWH / 2.3)));
    if (roomKeySetIs) {
        // マッチング設定
        g.beginPath();
        g.font = `${sizeWH / 30}pt Arial`;
        g.fillStyle = `rgba(255, 255, 255)`;
        g.fillText("ゲーム設定", boardPoint[0] + (boardOneSize), boardPoint[1] + (3.5 * boardOneSize) + (boardLine * 2) + (boardOneSize / 5));
        if (WebSocketSettings.host) {
            if (WebSocketSettings.connected) {
                if (!WebSocketSettings.started) {
                    // スタートボタン
                    g.beginPath();
                    g.fillStyle = "rgba(255, 255, 255)";
                    g.fillRect(boardPoint[0] + ((2 + 1) * boardOneSize) + (boardLine * (3)), boardPoint[1] + ((4 + 1) * boardOneSize) + (boardLine * 5), (boardOneSize * 2) + boardLine, boardOneSize);
                    // スタートボタン文字
                    g.beginPath();
                    g.font = `${sizeWH / 25}pt Arial`;
                    g.fillStyle = `rgba(0, 0, 0)`;
                    g.textAlign = "center";
                    g.textBaseline = "middle";
                    g.fillText("スタート", boardPoint[0] + (4 * boardOneSize) + (boardLine * 4), boardPoint[1] + (5.5 * boardOneSize) + (boardLine * 6));
                }
                // 文字
                g.beginPath();
                g.font = `${sizeWH / 30}pt Arial`;
                g.fillStyle = `rgba(255, 255, 255)`;
                g.textAlign = "center";
                g.textBaseline = "middle";
                g.fillText("あなたがホストです", boardPoint[0] + ((boardEndPoint[0] - boardPoint[0]) / 2), boardPoint[1] + (7 * boardOneSize));
            } else {
                g.beginPath();
                g.font = `${sizeWH / 30}pt Arial`;
                g.fillStyle = `rgba(255, 255, 255)`;
                g.textAlign = "center";
                g.textBaseline = "middle";
                g.fillText("プレイヤーを待っています", boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (5.5 * boardOneSize) + (boardLine * 6));
            }
        } else {
            g.beginPath();
            g.font = `${sizeWH / 30}pt Arial`;
            g.fillStyle = `rgba(255, 255, 255)`;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText("ホストがゲームを開始するまで", boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (5.5 * boardOneSize) + (boardLine));
            g.fillText("お待ちください", boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (6 * boardOneSize) + (boardLine));
        }
    } else {
        // マッチング番号
        g.beginPath();
        g.font = `${sizeWH / 30}pt Arial`;
        g.fillStyle = `rgba(255, 255, 255)`;
        g.fillText("ルーム番号設定", boardPoint[0] + (boardOneSize), boardPoint[1] + (3.5 * boardOneSize) + (boardLine * 2) + (boardOneSize / 5));
        g.textAlign = "left";
        g.textBaseline = "top";
        g.font = `${sizeWH / 15}pt Arial`;
        let tRoomNumber = WebSocketSettings.roomKey.split("");
        for (let i = 0; i < tRoomNumber.length; i++) {
            g.fillText(tRoomNumber[i], boardPoint[0] + ((i + 2) * boardOneSize) + (boardLine * i + 1) + (boardOneSize / 3.5), boardPoint[1] + (5 * boardOneSize) + (boardLine * 4) + (boardOneSize / 5));
        }
        // マッチング番号操作盤
        for (let i = 0; i < tRoomNumber.length; i++) {
            roomNumberSetCanvas(i, 4, true);
        }
        for (let i = 0; i < tRoomNumber.length; i++) {
            roomNumberSetCanvas(i, 6, false);
        }
        // Goボタン
        for (let i = 0; i < 3; i++) {
            g.beginPath();
            gContextSetPiece([boardPoint[0] + (7 * boardOneSize) + (boardLine * 6) - (boardOneSize / 2), boardPoint[1] + ((5+i) * boardOneSize) + (boardLine * (4+i)) - (boardOneSize / 2), boardOneSize / 2.3]);
            g.fillStyle = "rgba(255,255,255)";
            g.fill();
        }
        g.beginPath();
        g.font = `${sizeWH / 20}pt Arial`;
        g.fillStyle = `rgba(0, 0, 0)`;
        g.textAlign = "center";
        g.textBaseline = "top";
        g.fillText("Go", boardPoint[0] + (6 * boardOneSize) + (boardLine * 5) + (boardOneSize / 1.9), boardPoint[1] + (5 * boardOneSize) + (boardLine * 5) + (boardOneSize / 5));
        g.font = `${sizeWH / 47}pt Arial`;
        g.fillText("ぼっち", boardPoint[0] + (6 * boardOneSize) + (boardLine * 5) + (boardOneSize / 1.9), boardPoint[1] + (6 * boardOneSize) + (boardLine * 6) + (boardOneSize / 3));
        g.font = `${sizeWH / 47}pt Arial`;
        g.fillText("遊び方", boardPoint[0] + (6 * boardOneSize) + (boardLine * 5) + (boardOneSize / 1.9), boardPoint[1] + (4 * boardOneSize) + (boardLine * 5) + (boardOneSize / 3));
    }
}

/*
 操作盤用
 */
function roomNumberSetCanvas (i, i2, up = true) {
    g.beginPath();
    gContextSetPiece([boardPoint[0] + ((i+3) * boardOneSize) + (boardLine*(i+2)) - (boardOneSize/2), boardPoint[1] + ((i2+1) * boardOneSize) + (boardLine*i2) - (boardOneSize/2), boardOneSize/2.3]);
    g.fillStyle = "rgba(255,255,255)";
    g.fill();
    g.beginPath();
    g.font = `${sizeWH / 20}pt Arial`;
    g.fillStyle = `rgba(0,0,0)`;
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillText(up?"↑":"↓", boardPoint[0] + ((i+2) * boardOneSize) + (boardLine*(i+1)) + (boardOneSize/1.9), boardPoint[1] + ((i2) * boardOneSize) + (boardLine*(i2-1)) + (boardOneSize/5));
}
/*
 ピースを描写する
 */
function gContextSetPiece(xyr, r = 1) {
    g.beginPath();
    //g.arc( xyr[0], xyr[1], xyr[2], 0, 360 * Math.PI / 180, false );
    g.ellipse(xyr[0], xyr[1], xyr[2]/r, xyr[2], Math.PI, 0, 2 * Math.PI);
    return true;
}

/*
 CPUの動作用
 */
function cpGo () {
    let canPointA = canPoint;
    if (zeroIs) {
        canPointA = zeroCanPoint;
    }
    let canPointFilter = [];
    for (const canPointKey in canPointA) {
        for (const canPointKeyAs in canPointA[canPointKey]) {
            if (canPointA[canPointKey][canPointKeyAs]) {
                let counter = setOthelloTurnCounter(Number(canPointKey), Number(canPointKeyAs));
                canPointFilter.push([Number(canPointKey), Number(canPointKeyAs), counter]);
            }
        }
    }
    canPointFilter.sort(function(a, b) {
        if (a[2] > b[2]) {
            return -1;
        } else {
            return 1;
        }
    })
    let selectPoint = [canPointFilter[0][0], canPointFilter[0][1]];
    // 端っこが取れるなら取る
    let l1 = canPointFilter.find(f=>f[0]===0&&f[1]===0);
    let l2 = canPointFilter.find(f=>f[0]===0&&f[1]===boardLength-1);
    let r1 = canPointFilter.find(f=>f[0]===boardLength-1&&f[1]===0);
    let r2 = canPointFilter.find(f=>f[0]===boardLength-1&&f[1]===boardLength-1);
    if (l1) selectPoint = l1;
    else if (l2) selectPoint = l2;
    else if (r1) selectPoint = r1;
    else if (r2) selectPoint = r2;
    canvasMouseClick(null,true, selectPoint);
}

/*
 連続クリック防止（バグ防止のため定期解除）
 */
let clicked_interval = setInterval(() => _clicked = false, 1000);

/*
 裏返せる数を計算
 */

function setOthelloTurnCounter (x, y) {
    if (x == null || y == null) return 0;
    let turnList = [];
    let _cachePiece = JSON.parse(JSON.stringify(nowPiece));
    _cachePiece[x][y] = {id: nowNumber};
    // 右方向
    let _rightCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[i][y].id == null || _cachePiece[i][y].zeroIs) break;
        if (_cachePiece[i][y].id !== nowNumber) continue;
        if (x!==i) {
            _rightCount = i;
            break;
        }
    }
    if (_rightCount !== null) {
        for (let i = x; i <= _rightCount; i++) {
            if (_rightCount-x>=2) setWPieceCounter(x,y,i,y,nowNumber);
        }
    }

    // 下方向
    let _downCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[x][i].id == null || _cachePiece[x][i].zeroIs) break;
        if (_cachePiece[x][i].id !== nowNumber) continue;
        if (y!==i) {
            _downCount = i;
            break;
        }
    }
    if (_downCount !== null) {
        for (let i = y; i <= _downCount; i++) {
            if (_downCount-y>=2) setWPieceCounter(x,y,x, i,nowNumber);
        }
    }

    // 左方向
    let _leftCount = null;
    for (let i = x; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[i][y].id == null || _cachePiece[i][y].zeroIs) break;
        if (_cachePiece[i][y].id !== nowNumber) continue;
        if (x!==i) {
            _leftCount = i;
            break;
        }
    }
    if (_leftCount !== null) {
        for (let i = _leftCount; i <= x; i++) {
            if (x-_leftCount>=2) setWPieceCounter(x,y,i,y,nowNumber);
        }
    }

    // 上方向
    let _upCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[x][i].id == null || _cachePiece[x][i].zeroIs) break;
        if (_cachePiece[x][i].id !== nowNumber) continue;
        if (y!==i) {
            _upCount = i;
            break;
        }
    }
    if (_upCount !== null) {
        for (let i = _upCount; i <= y; i++) {
            if (y-_upCount>=2) setWPieceCounter(x,y,x,i, nowNumber);
        }
    }

    // 右上方向
    let _rightUpCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[i][y+(x-i)].id == null || _cachePiece[i][y+(x-i)].zeroIs) break;
        if (_cachePiece[i][y+(x-i)].id !== nowNumber) continue;
        if (x!==i) {
            _rightUpCount = i;
            break;
        }
    }
    if (_rightUpCount !== null) {
        for (let i = x; i <= _rightUpCount; i++) {
            if (_rightUpCount-x>=2) setWPieceCounter(x,y,i, y+(x-i), nowNumber);
        }
    }

    // 左下方向
    let _leftDownCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[x+(y-i)][i].id == null || _cachePiece[x+(y-i)][i].zeroIs) break;
        if (_cachePiece[x+(y-i)][i].id !== nowNumber) continue;
        if (y!==i) {
            _leftDownCount = i;
            break;
        }
    }
    if (_leftDownCount !== null) {
        for (let i = y; i <= _leftDownCount; i++) {
            if (_leftDownCount-y>=2) setWPieceCounter(x,y,x+(y-i),i, nowNumber);
        }
    }

    // 右下方向
    let _rightDownCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[i][y-(x-i)].id == null || _cachePiece[i][y-(x-i)].zeroIs) break;
        if (_cachePiece[i][y-(x-i)].id !== nowNumber) continue;
        if (x!==i) {
            _rightDownCount = i;
            break;
        }
    }
    if (_rightDownCount !== null) {
        for (let i = x; i <= _rightDownCount; i++) {
            if (_rightDownCount-x>=2) setWPieceCounter(x,y,i, y-(x-i), nowNumber);
        }
    }

    // 左上方向
    let _leftUpCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (_cachePiece[x-(y-i)][i].id == null || _cachePiece[x-(y-i)][i].zeroIs) break;
        if (_cachePiece[x-(y-i)][i].id !== nowNumber) continue;
        if (y!==i) {
            _leftUpCount = i;
            break;
        }
    }
    if (_leftUpCount !== null) {
        for (let i = _leftUpCount; i <= y; i++) {
            if (y-_leftUpCount>=2) setWPieceCounter(x,y,x-(y-i), i, nowNumber);
        }
    }

    function setWPieceCounter (sX, sY, x, y, number) {
        if (!(sX == x && sY == y) && number !== _cachePiece[x][y].id) {
            if (!turnList.includes(`${x}:${y}`)) {
                turnList.push(`${x}:${y}`);
            }
        }
    }
    return turnList.length;
}