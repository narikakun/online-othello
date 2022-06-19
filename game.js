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

let playerColor = { // プレイヤー一覧
    1: "rgba(0, 0, 0)",
    2: "rgba(255, 255, 255)",
    3: "rgba(255, 0, 0)",
    4: "rgba(0, 0, 255)"
};

let playerList = {
    1: null,
    2: null,
    3: null,
    4: null
}

playerList[1] = "1";
playerList[2] = "1";
playerList[3] = "1";
playerList[4] = "1";

let myNumber =  1;
let nowNumber = 1;

/*
 初期設定
 */
function init() {
    // 全マスを一度リセット
    for (let i = -1; i < boardLength+1; i++) {
        nowPiece[i] = {};
        for (let ib= -1; ib < boardLength+1; ib++) {
            nowPiece[i][ib] = null;
        }
    }
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
    getSize();
    drawOthelloCanvas();
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
    drawOthelloCanvas();
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
    init();
});

/*
 キャンバスクリック時の動作
 */
function canvasMouseClick () {
    if (nowPanel[0] == null || nowPanel[1] == null || nowNumber !== myNumber || !canPoint[nowPanel[0]][nowPanel[1]]) return;
    nowPiece[nowPanel[0]][nowPanel[1]] = myNumber;
    setOthelloTurn(nowPanel[0],nowPanel[1]);
    nextPlayer();
}

/*
 次のプレイヤーに回す
 */
function nextPlayer () {
    nowNumber++;
    myNumber++;
    if ((playerList[3]&&playerList[4])?nowNumber > 4:nowNumber > 2) {
        nowNumber = 1;
        myNumber = 1;
    }
    drawOthelloCanvas();
    let canPointCount = 0;
    for (const canPointKey in canPoint) {
        for (const canPointKeyAs in canPoint[canPointKey]) {
            if (canPoint[canPointKey][canPointKeyAs]) canPointCount++;
        }
    }
    if (canPointCount == 0) {
        // スキップ
        nextPlayer();
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
    drawOthelloCanvas();
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
            if (0 > i || i > boardLength) continue;
            if (nowPiece[i][y] == null || ((nowPiece[i][y] === nowNumber) && (x+1===i))) break;
            if (nowPiece[i][y] !== nowNumber && nowPiece[i][y] !== null) continue;
            if (nowPiece[i][y] === nowNumber) return true;
        }

        // 左横方向（現在マスから左・横を確認）
        for (let i = x-1; i > 0; i--) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[i][y] == null || ((nowPiece[i][y] === nowNumber) && (x-1===i))) break;
            if (nowPiece[i][y] !== nowNumber && nowPiece[i][y] !== null) continue;
            if (nowPiece[i][y] === nowNumber) return true;
        }

        // 下方向（現在マスから下・縦を確認）
        for (let i = y+1; i < boardLength; i++) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[x][i] == null || ((nowPiece[x][i] === nowNumber) && (y+1===i))) break;
            if (nowPiece[x][i] !== nowNumber && nowPiece[x][i] !== null) continue;
            if (nowPiece[x][i] === nowNumber) return true;
        }

        // 上方向（現在マスから上・縦を確認）
        for (let i = y-1; i > 0; i--) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[x][i] == null || ((nowPiece[x][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x][i] !== nowNumber && nowPiece[x][i] !== null) continue;
            if (nowPiece[x][i] === nowNumber) return true;
        }

        // 左上方向（現在マスから左上・斜めを確認）
        for (let i = y-1; i > 0; i--) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i] == null || ((nowPiece[x-(y-i)][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x-(y-i)][i] !== nowNumber && nowPiece[x-(y-i)][i] !== null) continue;
            if (nowPiece[x-(y-i)][i] === nowNumber) return true;
        }

        // 右上方向（現在マスから右上・斜めを確認）
        for (let i = y-1; i > 0; i--) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[x+(y-i)][i] == null || ((nowPiece[x+(y-i)][i] === nowNumber) && (y-1===i))) break;
            if (nowPiece[x+(y-i)][i] !== nowNumber && nowPiece[x+(y-i)][i] !== null) continue;
            if (nowPiece[x+(y-i)][i] === nowNumber) return true;
        }

        // 左下方向（現在マスから左下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[x-(y-i)][i] == null || ((nowPiece[x-(y-i)][i] === nowNumber) && (y+1===i))) break;
            if (nowPiece[x-(y-i)][i] !== nowNumber && nowPiece[x-(y-i)][i] !== null) continue;
            if (nowPiece[x-(y-i)][i] === nowNumber) return true;
        }

        // 右下方向（現在マスから右下・斜めを確認）
        for (let i = y+1; i < boardLength; i++) {
            if (0 > i || i > boardLength) continue;
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
    let rightCount = 0;
    for (let i = x; i < boardLength; i++) {
        if (0 > i || i > boardLength) continue;
        if (nowPiece[i][y] == null) break;
        if (nowPiece[i][y] !== nowNumber) continue;
        if (x!==i) {
            rightCount = i;
            break;
        }
    }
    if (rightCount !== 0) {
        for (let i = x; i <= rightCount; i++) {
            nowPiece[i][y] = nowNumber;
        }
    }

    // 下方向
    let downCount = 0;
    for (let i = y; i < boardLength; i++) {
        if (0 > i || i > boardLength) continue;
        if (nowPiece[x][i] == null) break;
        if (nowPiece[x][i] !== nowNumber) continue;
        if (y!==i) {
            downCount = i;
            break;
        }
    }
    if (downCount !== 0) {
        for (let i = y; i <= downCount; i++) {
            nowPiece[x][i] = nowNumber;
        }
    }

    // 左方向
    let leftCount = 0;
    for (let i = x; i > 0; i--) {
        if (0 > i || i > boardLength) continue;
        if (nowPiece[i][y] == null) break;
        if (nowPiece[i][y] !== nowNumber) continue;
        if (x!==i) {
            leftCount = i;
            break;
        }
    }
    if (leftCount !== 0) {
        for (let i = leftCount; i <= x; i++) {
            nowPiece[i][y] = nowNumber;
        }
    }

    // 上方向
    let upCount = 0;
    for (let i = y; i > 0; i--) {
        if (0 > i || i > boardLength) continue;
        if (nowPiece[x][i] == null) break;
        if (nowPiece[x][i] !== nowNumber) continue;
        if (y!==i) {
            upCount = i;
            break;
        }
    }
    if (upCount !== 0) {
        for (let i = upCount; i <= y; i++) {
            nowPiece[x][i] = nowNumber;
        }
    }
}

/*
 オセロのキャンバスを作る
 */
function drawOthelloCanvas () {
    // キャンバスをリセット
    g.beginPath ();
    g.fillStyle = "rgba(0, 0, 0)";
    g.fillRect(0, 0, canvas.width, canvas.height);
    // 背景を描写（黒色）
    g.beginPath ();
    g.fillStyle = "rgba(19, 19, 19)";
    g.fillRect((canvas.width/2)-(boardWH/2)-boardPadding, (canvas.height/2)-(boardWH/2)-boardPadding, boardWH, boardWH);
    boardPoint = [(canvas.width/2)-(boardWH/2)+boardLine, (canvas.height/2)-(boardWH/2)+boardLine];
    boardEndPoint = [boardPoint[0] + (boardLength * boardOneSize) + ((boardLine) * boardLength), boardPoint[1] + (boardLength * boardOneSize) + ((boardLine) * boardLength)];
    let nowX = 0;
    let nowY = 0;
    for (let i = 0; i < boardLength; i++) {
        canPoint[i] = {};
        for (let ib= 0; ib < boardLength; ib++) {
            canPoint[i][ib] = setCanDoOthello(i, ib);
        }
    }
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
            g.fillStyle = "rgba(0,0,0,0.6)";
            g.fill();
        } else if (nowPiece[nowX][nowY] !== null) {
            gContextSetPiece(pieceXyR);
            g.fillStyle = playerColor[nowPiece[nowX][nowY]];
            g.fill();
        } else if (canPoint[nowX][nowY]) {
            gContextSetPiece(pieceXyR);
            g.fillStyle = "rgba(0,0,0,0.2)";
            g.fill();
        }
        nowX++;
    }
}

function gContextSetPiece(xyr) {
    g.beginPath();
    g.arc( xyr[0], xyr[1], xyr[2], 0, 360 * Math.PI / 180, false );
    return true;
}