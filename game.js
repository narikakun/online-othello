let wrapper = null;	// キャンバスの親要素
let canvas = null;	// キャンバス
let g = null; // コンテキスト
let $id = function(id){ return document.getElementById(id); }; // DOM取得用
let boardLength = 8; // オセロボードの横・縦の数　（偶数で指定が必須）
let boardOneSize = 0; // オセロボードの一つ当たりの大きさ
let boardPoint = [];
let boardEndPoint = [];
let nowPanel = [null, null]; // 現在の位置
let nowPiece = {}; // 位置とプレイヤー情報（int）
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
    show: false
}
let roomKeySetIs = false;

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
            nowPiece[i][ib] = null;
            canPoint[i][ib] = null;
            zeroCanPoint[i][ib] = null;
        }
    }
    if (!startNow) return;
    statusMessage.string = "ゲームを開始します。";
    let boardLengthHalf = Math.floor(boardLength/2);
    nowPiece[boardLengthHalf-1][boardLengthHalf-1] = 1; // 左上
    nowPiece[boardLengthHalf][boardLengthHalf-1] = 2; // 右上
    if (playerList[3] && playerList[4]) {
        nowPiece[boardLengthHalf - 1][boardLengthHalf] = 3; // 左下
        nowPiece[boardLengthHalf][boardLengthHalf] = 4; // 右下
        nowPiece[boardLengthHalf+1][boardLengthHalf-1] = 4; // 右
        nowPiece[boardLengthHalf][boardLengthHalf+1] = 3; // 下
        nowPiece[boardLengthHalf - 2][boardLengthHalf] = 1; // 左
        nowPiece[boardLengthHalf-1][boardLengthHalf-2] = 2; // 上
    } else {
        nowPiece[boardLengthHalf - 1][boardLengthHalf] = 2;
        nowPiece[boardLengthHalf][boardLengthHalf] = 1;
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
    // 初期設定
    getSize();
    init();
});

/*
 キャンバスクリック時の動作
 */
function canvasMouseClick (e, cpu = false, panel = null)
{
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
        if (zeroIs) {
            if (!zeroCanPoint[_panel[0]][_panel[1]]) {
                _clicked = false;
                return;
            }
        } else {
            if (!canPoint[_panel[0]][_panel[1]]) {
                _clicked = false;
                return;
            }
        }
        if (WebSocketSettings.host) {
            zeroIs = false;
            nowPiece[_panel[0]][_panel[1]] = nowNumber;
            setOthelloTurn(_panel[0], _panel[1]);
            nextPlayer();
        } else {
            _ws.send(JSON.stringify({
                "to": WebSocketSettings.roomHost,
                "type": "setOthello",
                "roomKey": WebSocketSettings.toGameRoomKey,
                "panel": _panel
            }));
        }
    } else {
        _clicked = true;
        console.log(_panel)
        if (_panel[0] == null || _panel[1] == null) {
            _clicked = false;
            return;
        }
        if (_panel[0] == 2 && _panel[1] == 4) roomKeyUpDown(0, true);
        if (_panel[0] == 2 && _panel[1] == 6) roomKeyUpDown(0, false);
        if (_panel[0] == 3 && _panel[1] == 4) roomKeyUpDown(1, true);
        if (_panel[0] == 3 && _panel[1] == 6) roomKeyUpDown(1, false);
        if (_panel[0] == 4 && _panel[1] == 4) roomKeyUpDown(2, true);
        if (_panel[0] == 4 && _panel[1] == 6) roomKeyUpDown(2, false);
        if (_panel[0] == 5 && _panel[1] == 4) roomKeyUpDown(3, true);
        if (_panel[0] == 5 && _panel[1] == 6) roomKeyUpDown(3, false);
        if (_panel[0] == 6 && _panel[1] == 5) websocketStart();
        if ((_panel[0] == 3 && _panel[1] == 5) || (_panel[0] == 4 && _panel[1] == 5)) {
            if (WebSocketSettings.connected && WebSocketSettings.playerListA.length > 1 && !WebSocketSettings.started) {
                WebSocketSettings.started = true;
                if (WebSocketSettings.playerListA.length < 3) WebSocketSettings.playerMax = 2;
                startCount();
            }
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
function showPlayerMessage () {
    if (myNumber == nowNumber) {
        showMessage.string = "あなたのターンです。";
    } else {
        showMessage.string = `${playerColorString[nowNumber]}のターンです。`;
    }
    showMessage.show = true;
    _clicked = true;
    setTimeout(()=>{
        showMessage.show = false;
        _clicked = false;
        if (playerList[nowNumber].cpu) cpGo();
    }, 2000);
}

/*
 次のプレイヤーに回す
 */
function nextPlayer () {
    nowNumber++;
    if ((playerList[3]&&playerList[4])?nowNumber > 4:nowNumber > 2) {
        nowNumber = 1;
    }
    _clicked = false;
    canPointSet();
    let canPointCount = 0;
    for (const canPointKey in canPoint) {
        for (const canPointKeyAs in canPoint[canPointKey]) {
            if (canPoint[canPointKey][canPointKeyAs]) canPointCount++;
        }
    }
    console.log(playerList[nowNumber]);
    if (canPointCount === 0) {
        let nowPieceCount = 0;
        let nowPieceNullCount = 0;
        for (let i = 0; i < boardLength; i++) {
            for (let i2 = 0; i2 < boardLength; i2++) {
                if (nowPiece[i][i2] === nowNumber) nowPieceCount++;
                if (nowPiece[i][i2] == null) nowPieceNullCount++;
            }
        }
        console.log(`${nowPieceCount} ${nowPieceNullCount}`)
        if (nowPieceNullCount === 0) {
            WebSocketSettings.isFinish = true;
            nowNumber = 5;
        } else if (nowPieceCount === 0) {
            // 一つもピースがなくなった場合
            zeroIs = true;
            for (let i = 0; i < boardLength; i++) {
                zeroCanPoint[i] = {};
                for (let ib = 0; ib < boardLength; ib++) {
                    for (let d = -1; d <= 1; d++) {
                        for (let e = -1; e <= 1; e++) {
                            if (nowPiece[i + d][ib + e] !== null) zeroCanPoint[i][ib] = true;
                        }
                    }
                }
            }
        } else {
            // スキップ
            nextPlayer();
            return;
        }
    }
    if (WebSocketSettings.host) {
        _ws.send(JSON.stringify({
            "toH": WebSocketSettings.toGameRoomKey,
            "type": "nextPlayerRefresh",
            "roomKey": WebSocketSettings.toGameRoomKey,
            "nowNumber": nowNumber,
            "nowPiece": nowPiece,
            "zeroCanPoint": zeroCanPoint,
            "zeroIs": zeroIs,
            "canPoint": canPoint
        }));
        showPlayerMessage();
    }
}

/*
 終わった時の動作
 */
function gameFinish () {
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
    for (let i = 0; i < boardLength; i++) {
        for (let i2 = 0; i2 < boardLength; i2++) {
            if (nowPiece[i][i2] == null) continue;
            playerPiece[nowPiece[i][i2]]++;
        }
    }
    let pieceArray = Object.keys(playerPiece).map((k)=>({ key: k, value: playerPiece[k] }));
    pieceArray.sort((a, b) => a.value - b.value);
    g.font = `${sizeWH / 30}pt Arial`;
    g.fillText(`1位: ${playerColorString[pieceArray[0].key]} => ${pieceArray[0].value}個`, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (3.5 * boardOneSize));
    g.fillText(`2位: ${playerColorString[pieceArray[1].key]} => ${pieceArray[1].value}個`, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (4.5 * boardOneSize));
    g.fillText(`3位: ${playerColorString[pieceArray[2].key]} => ${pieceArray[2].value}個`, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (5.5 * boardOneSize));
    g.fillText(`4位: ${playerColorString[pieceArray[3].key]} => ${pieceArray[3].value}個`, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), boardPoint[1] + (6.5 * boardOneSize));

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

    if (nowPiece[x][y] == null) {
        /*

            ルールを再確認したら挟めるマスしか置けないことに気づいたなりかくん

                if (nowPiece[x + 1][y] === myNumber) return true; // 右
                if (nowPiece[x + 1][y + 1] === myNumber) return true; // 右下
                if (nowPiece[x][y + 1] === myNumber) return true; // 下
                if (nowPiece[x - 1][y + 1] === myNumber) return true; // 左下
                if (nowPiece[x - 1][y] === myNumber) return true; // 左
                if (nowPiece[x - 1][y - 1] === myNumber) return true; // 左上
                if (nowPiece[x][y - 1] === myNumber) return true; // 上
                if (nowPiece[x + 1][y - 1] === myNumber) return true; // 右上

                これをforでまとめておく
                for (let d = -1; d <= 1; d++) {
                    for (let e = -1; e <= 1; e++) {
                        if (nowPiece[x + d][y + e] === myNumber) return true;
                    }
                }
         */
    }

    if (nowPiece[x][y] == null) {
        // 右横部分（現在マスから右・横を確認）
        for (let i = x+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[i][y] == null || ((nowPiece[i][y] === nowNumber) && (x+1===i))) break;
            if (nowPiece[i][y] !== nowNumber && nowPiece[i][y] !== null) continue;
            if (nowPiece[i][y] === nowNumber) return true;
        }

        // 左横方向（現在マスから左・横を確認）
        for (let i = x-1; i > -1; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[i][y] == null || ((nowPiece[i][y] === nowNumber) && (x-1===i))) break;
            if (nowPiece[i][y] !== nowNumber && nowPiece[i][y] !== null) continue;
            if (nowPiece[i][y] === nowNumber) return true;
        }

        // 下方向（現在マスから下・縦を確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x][i] == null || ((nowPiece[x][i] === nowNumber) && (y+1===i))) break;
            if (nowPiece[x][i] !== nowNumber && nowPiece[x][i] !== null) continue;
            if (nowPiece[x][i] === nowNumber) return true;
        }

        // 上方向（現在マスから上・縦を確認）
        for (let i = y-1; i > -1; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x][i] == null || ((nowPiece[x][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x][i] !== nowNumber && nowPiece[x][i] !== null) continue;
            if (nowPiece[x][i] === nowNumber) return true;
        }

        // 左上方向（現在マスから左上・斜めを確認）
        for (let i = y-1; i > 0; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i] == null || ((nowPiece[x-(y-i)][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x-(y-i)][i] !== nowNumber && nowPiece[x-(y-i)][i] !== null) continue;
            if (nowPiece[x-(y-i)][i] === nowNumber) return true;
        }

        // 右上方向（現在マスから右上・斜めを確認）
        for (let i = y-1; i > 0; i--) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x+(y-i)][i] == null || ((nowPiece[x+(y-i)][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x+(y-i)][i] !== nowNumber && nowPiece[x+(y-i)][i] !== null) continue;
            if (nowPiece[x+(y-i)][i] === nowNumber) return true;
        }

        // 左下方向（現在マスから左下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i] == null || ((nowPiece[x-(y-i)][i] === nowNumber) && (y+1===i))) break;
            if (nowPiece[x-(y-i)][i] !== nowNumber && nowPiece[x-(y-i)][i] !== null) continue;
            if (nowPiece[x-(y-i)][i] === nowNumber) return true;
        }

        // 右下方向（現在マスから右下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (-1 > i || i > boardLength) continue;
            if (nowPiece[x+(y-i)][i] == null || ((nowPiece[x+(y-i)][i] === nowNumber) && (y+1===i))) break;
            if (nowPiece[x+(y-i)][i] !== nowNumber && nowPiece[x+(y-i)][i] !== null) continue;
            if (nowPiece[x+(y-i)][i] === nowNumber) return true;
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
        if (nowPiece[i][y] == null) break;
        if (nowPiece[i][y] !== nowNumber) continue;
        if (x!==i) {
            rightCount = i;
            break;
        }
    }
    if (rightCount !== null) {
        for (let i = x; i <= rightCount; i++) {
            nowPiece[i][y] = nowNumber;
        }
    }

    // 下方向
    let downCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x][i] == null) break;
        if (nowPiece[x][i] !== nowNumber) continue;
        if (y!==i) {
            downCount = i;
            break;
        }
    }
    if (downCount !== null) {
        for (let i = y; i <= downCount; i++) {
            nowPiece[x][i] = nowNumber;
        }
    }

    // 左方向
    let leftCount = null;
    for (let i = x; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y] == null) break;
        if (nowPiece[i][y] !== nowNumber) continue;
        if (x!==i) {
            leftCount = i;
            break;
        }
    }
    if (leftCount !== null) {
        for (let i = leftCount; i <= x; i++) {
            nowPiece[i][y] = nowNumber;
        }
    }

    // 上方向
    let upCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x][i] == null) break;
        if (nowPiece[x][i] !== nowNumber) continue;
        if (y!==i) {
            upCount = i;
            break;
        }
    }
    if (upCount !== null) {
        for (let i = upCount; i <= y; i++) {
            nowPiece[x][i] = nowNumber;
        }
    }

    // 右上方向
    let rightUpCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y+(x-i)] == null) break;
        if (nowPiece[i][y+(x-i)] !== nowNumber) continue;
        if (x!==i) {
            rightUpCount = i;
            break;
        }
    }
    if (rightUpCount !== null) {
        for (let i = x; i <= rightUpCount; i++) {
            nowPiece[i][y+(x-i)] = nowNumber;
        }
    }

    // 左下方向
    let leftDownCount = null;
    for (let i = y; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x+(y-i)][i] == null) break;
        if (nowPiece[x+(y-i)][i] !== nowNumber) continue;
        if (y!==i) {
            leftDownCount = i;
            break;
        }
    }
    if (leftDownCount !== null) {
        for (let i = y; i <= leftDownCount; i++) {
            nowPiece[x+(y-i)][i] = nowNumber;
        }
    }

    // 右下方向
    let rightDownCount = null;
    for (let i = x; i < boardLength; i++) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[i][y-(x-i)] == null) break;
        if (nowPiece[i][y-(x-i)] !== nowNumber) continue;
        if (x!==i) {
            rightDownCount = i;
            break;
        }
    }
    if (rightDownCount !== null) {
        for (let i = x; i <= rightDownCount; i++) {
            nowPiece[i][y-(x-i)] = nowNumber;
        }
    }

    // 左上方向
    let leftUpCount = null;
    for (let i = y; i > -1; i--) {
        if (-1 > i || i > boardLength) continue;
        if (nowPiece[x-(y-i)][i] == null) break;
        if (nowPiece[x-(y-i)][i] !== nowNumber) continue;
        if (y!==i) {
            leftUpCount = i;
            break;
        }
    }
    if (leftUpCount !== null) {
        for (let i = leftUpCount; i <= y; i++) {
            nowPiece[x-(y-i)][i] = nowNumber;
        }
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
    g.beginPath ();
    g.fillStyle = "rgba(0, 0, 0)";
    g.fillRect(0, 0, canvas.width, canvas.height);
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
        if (nowX === nowPanel[0] && nowY === nowPanel[1] && nowPiece[nowX][nowY] == null && nowNumber === myNumber) {
            gContextSetPiece(pieceXyR);
            g.fillStyle = `rgba(${playerColor[nowNumber]}, 0.6)`;
            g.fill();
        } else if (nowPiece[nowX][nowY] !== null) {
            gContextSetPiece(pieceXyR);
            g.fillStyle = `rgba(${playerColor[nowPiece[nowX][nowY]]})`;
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
        nowX++;
    }
    if (startNow) {
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
                if (!nowPiece[nowPieceKey][nowPieceKeyAs]) continue;
                playerListPieceCount[nowPiece[nowPieceKey][nowPieceKeyAs]]++;
            }
        }
        g.fillText(`参加人数: ${WebSocketSettings.playerListA.length}人 | ${playerList[nowNumber].name}の数: ${playerListPieceCount[nowNumber]} | あなたは ${playerColorString[myNumber]}`, boardPoint[0], boardEndPoint[1] + sizeWH / 200);
    } else if (WebSocketSettings.isFinish) {
        gameFinish();
    } else {
        // タイトル画面
        showTitleScreen();
    }
    // ボード上にメッセージを置く
    g.beginPath ();
    g.font = `${sizeWH/50}pt Arial`;
    g.fillStyle = `rgba(${statusMessage.color[0]}, ${statusMessage.color[1]}, ${statusMessage.color[2]})`;
    g.textAlign = "left";
    g.textBaseline = "bottom";
    g.fillText(statusMessage.string + ` | ${new Date().getTime()} | ${_clicked}`, boardPoint[0], boardPoint[1]-(sizeWH/50));
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
        g.fillText(showMessage.string, boardPoint[0]+((boardEndPoint[0]-boardPoint[0])/2), (boardEndPoint[1]-boardPoint[1])/2);
    }
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
        g.fillText(titleA[i], boardPoint[0] + ((i+1) * boardOneSize) + (boardLine*i) + (boardOneSize/8), boardPoint[1] + (1 * boardOneSize) + (boardLine*0) + (boardOneSize/5));
    }
    let titleB = "ゲーム".split("");
    for (let i = 0; i < titleB.length; i++) {
        g.fillText(titleB[i], boardPoint[0] + ((i+4) * boardOneSize) + (boardLine*(i+3)) + (boardOneSize/8), boardPoint[1] + (2 * boardOneSize) + (boardLine*1) + (boardOneSize/5));
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
        g.beginPath();
        gContextSetPiece([boardPoint[0] + (7 * boardOneSize) + (boardLine * 6) - (boardOneSize / 2), boardPoint[1] + (6 * boardOneSize) + (boardLine * 5) - (boardOneSize / 2), boardOneSize / 2.3]);
        g.fillStyle = "rgba(255,255,255)";
        g.fill();
        g.beginPath();
        g.font = `${sizeWH / 20}pt Arial`;
        g.fillStyle = `rgba(0, 0, 0)`;
        g.textAlign = "center";
        g.textBaseline = "top";
        g.fillText("Go", boardPoint[0] + (6 * boardOneSize) + (boardLine * 5) + (boardOneSize / 1.9), boardPoint[1] + (5 * boardOneSize) + (boardLine * 5) + (boardOneSize / 5));
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
function gContextSetPiece(xyr) {
    g.beginPath();
    g.arc( xyr[0], xyr[1], xyr[2], 0, 360 * Math.PI / 180, false );
    return true;
}

/*
 CPUの動作用
 */
function cpGo () {
    let canPointFilter = [];
    for (const canPointKey in canPoint) {
        for (const canPointKeyAs in canPoint[canPointKey]) {
            if (canPoint[canPointKey][canPointKeyAs]) canPointFilter.push([Number(canPointKey), Number(canPointKeyAs)]);
        }
    }
    let selectPoint = canPointFilter[Math.floor(Math.random() * canPointFilter.length)];
    console.log(selectPoint);
    canvasMouseClick(null,true, selectPoint);
}

/*
 100msごとに描写更新
 */
setInterval(() => {
    drawOthelloCanvas();
}, 100);

/*
 連続クリック防止（バグ防止のため定期解除）
 */
let clicked_interval = setInterval(() => _clicked = false, 1000);