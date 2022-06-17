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
    1: "rgba(255, 0, 255)",
    2: "rgba(0, 255, 255)",
    3: "rgba(255, 255, 255)",
    4: "rgba(255, 217, 102)"
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

let myNumber = 1;
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
    let boardLengthHanbun = Math.floor(boardLength/2);
    nowPiece[boardLengthHanbun-1][boardLengthHanbun-1] = 1;
    nowPiece[boardLengthHanbun][boardLengthHanbun-1] = 2;
    nowPiece[boardLengthHanbun-1][boardLengthHanbun] = 3;
    nowPiece[boardLengthHanbun][boardLengthHanbun] = 4;
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
function canvasMouseClick (e) {
    if (nowPanel[0] == null || nowPanel[1] == null || nowNumber !== myNumber || !canPoint[nowPanel[0]][nowPanel[1]]) return;
    nowPiece[nowPanel[0]][nowPanel[1]] = myNumber;
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
    let _nowPanel = [Math.floor((x-boardPoint[0])/((boardEndPoint[0]-boardPoint[0])/boardLength)), Math.floor((y-boardPoint[1])/((boardEndPoint[1]-boardPoint[1])/boardLength))];
    return _nowPanel;
}

/*
 置ける場所を考える
 */
function setCanDoOthello (id, x, y) {
    if (x == null || y == null) return false;

    /*
    if (nowPiece[x][y] == null) {
        if (nowPiece[x + 1][y] == myNumber) return true; // 右
        if (nowPiece[x + 1][y + 1] == myNumber) return true; // 右下
        if (nowPiece[x][y + 1] == myNumber) return true; // 下
        if (nowPiece[x - 1][y + 1] == myNumber) return true; // 左下
        if (nowPiece[x - 1][y] == myNumber) return true; // 左
        if (nowPiece[x - 1][y - 1] == myNumber) return true; // 左上
        if (nowPiece[x][y - 1] == myNumber) return true; // 上
        if (nowPiece[x + 1][y - 1] == myNumber) return true; // 右上
    }


     */
    if (nowPiece[x][y] == null) {
        // 右横方向
        for (let i = x+1; i < boardLength; i++) {
            if (0 > i || i > boardLength) continue;
            if (nowPiece[i][y] == null || x-i==0) break;
            if (nowPiece[i][y] !== myNumber && nowPiece[i][y] !== null) continue;
            console.log(`${x} ${y} ${i}`)
            if (nowPiece[i][y] == myNumber) return true;
        }

        /*
        // 左横方向
        for (let i = 0; i > 0; i--) {
            if (0 >= i || i > boardLength) continue;
            if (nowPiece[i][y] !== myNumber) continue;
            console.log(`${x} | ${y} | ${i}`)
            if (canPoint[i+1]) if (canPoint[i+1][y]) break;
            if (nowPiece[i][y] == myNumber) return true;
        }

         */
    }
    return false;
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
    console.log(nowPiece);
    for (let i = 0; i < boardLength; i++) {
        canPoint[i] = {};
        for (let ib= 0; ib < boardLength; ib++) {
            canPoint[i][ib] = setCanDoOthello(myNumber, i, ib);
        }
    }
    console.log(canPoint);
    for (let i = 0; i < boardLength*boardLength; i++) {
        if (nowX >= boardLength) {
            nowY++;
            nowX = 0;
        }
        if (!nowPiece[nowX]) continue;
        g.fillStyle = "rgb(56, 118, 29)";
        g.fillRect(boardPoint[0] + (nowX * boardOneSize) + (boardLine*nowX), boardPoint[1] + (nowY * boardOneSize) + (boardLine*nowY), boardOneSize, boardOneSize);
        if (nowX == nowPanel[0] && nowY == nowPanel[1] && nowPiece[nowX][nowY] == null && nowNumber == myNumber) {
            g.beginPath();
            g.arc( boardPoint[0] + ((nowX+1) * boardOneSize) + (boardLine*nowX) - (boardOneSize/2), boardPoint[1] + ((nowY+1) * boardOneSize) + (boardLine*nowY) - (boardOneSize/2), boardOneSize/2.3, 0 * Math.PI / 180, 360 * Math.PI / 180, false );
            g.fillStyle = "rgba(0,0,0,0.8)";
            g.fill();
        } else if (nowPiece[nowX][nowY] !== null) {
            g.beginPath();
            g.arc( boardPoint[0] + ((nowX+1) * boardOneSize) + (boardLine*nowX) - (boardOneSize/2), boardPoint[1] + ((nowY+1) * boardOneSize) + (boardLine*nowY) - (boardOneSize/2), boardOneSize/2.3, 0 * Math.PI / 180, 360 * Math.PI / 180, false );
            g.fillStyle = playerColor[nowPiece[nowX][nowY]];
            g.fill();
        } else if (canPoint[nowX][nowY]) {
            g.beginPath();
            g.arc( boardPoint[0] + ((nowX+1) * boardOneSize) + (boardLine*nowX) - (boardOneSize/2), boardPoint[1] + ((nowY+1) * boardOneSize) + (boardLine*nowY) - (boardOneSize/2), boardOneSize/2.3, 0 * Math.PI / 180, 360 * Math.PI / 180, false );
            g.fillStyle = "rgba(0,0,0,0.2)";
            g.fill();
        }
        nowX++;
    }
}