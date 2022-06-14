let wrapper = null;	// キャンバスの親要素
let canvas = null;	// キャンバス
let g = null; // コンテキスト
let $id = function(id){ return document.getElementById(id); }; // DOM取得用
let boardLength = 10; // オセロボードの横・縦の数
let boardOneSize = 0; // オセロボードの一つ当たりの大きさ
let boardOnePad = 5; // 余白
let nowBoardSize = [0, 0]; // オセロボードのサイズ（内部処理用）
let nowPanel = [null, null]; // 現在の位置
let nowPiece = {}; // 位置とプレイヤー情報（int）
let playerColor = { // プレイヤー一覧
    1: "rgba(255, 0, 255)",
    2: "rgba(0, 255, 255)",
    3: "rgba(255, 255, 255)",
    4: "rgba(255, 217, 102)"
};

/*
 キャンバスのサイズをウインドウに合わせて変更
 */
function getSize(){
    // キャンバスのサイズを再設定
    canvas.width = wrapper.offsetWidth;
    canvas.height =  wrapper.offsetHeight;
    let sizeWH = canvas.width; // 基準にする大きさ
    if (canvas.height < canvas.width) sizeWH = canvas.height;
    boardOneSize = (((sizeWH-(boardOnePad*boardLength))/1.1) / boardLength);
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
    for (let i = 0; i < boardLength*boardLength; i++) {
        nowPiece[i] = null;
    }
    // キャンバスをウインドウサイズにする
    getSize();
    console.log(nowPiece);
});

/*
 キャンバスクリック時の動作
 */
function canvasMouseClick (e) {
    let panelPoint = nowPanel[0]+(nowPanel[1]*boardLength);
    nowPiece[panelPoint] = 4;
}

/*
 キャンバス上でのマウスカーソル移動時の処理
 */
function canvasMouseMove(e) {
    let rect = e.target.getBoundingClientRect()
    let _nowPanel = othelloXY(e.clientX - rect.left-30, e.clientY - rect.top-30);
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
    let mouseMoveSize = (nowBoardSize[0]+boardOnePad)/(boardLength);
    let _nowPanel = [Math.floor(x/mouseMoveSize), Math.floor(y/mouseMoveSize)];
    return _nowPanel;
}

/*
 オセロのキャンバスを作る
 */
function drawOthelloCanvas () {
    g.beginPath ();
    g.fillStyle = "rgba(255,255,255)";
    g.fillRect(0, 0, canvas.width, canvas.height);
    let nowX = 0;
    let nowY = 0;
    for (let i = 0; i < boardLength*boardLength; i++) {
        if (nowX >= boardLength) {
            nowY++;
            nowX = 0;
        }
        let panelPoint = nowX+(nowY*boardLength);
        g.fillStyle = "rgb(56, 118, 29)";
        g.fillRect(30 + (nowX * boardOneSize), 30 + (nowY * boardOneSize), (boardOneSize - boardOnePad), (boardOneSize - boardOnePad));
        if (nowX == nowPanel[0] && nowY == nowPanel[1] && nowPiece[panelPoint] == null) {
            g.beginPath ();
            g.arc( 50 + ((nowX * boardOneSize)), 50 + ((nowY * boardOneSize)), boardOneSize/3, 0 * Math.PI / 180, 360 * Math.PI / 180, false );
            g.fillStyle = "rgba(0,0,0,0.8)";
            g.fill();
        } else if (nowPiece[panelPoint] !== null) {
            g.beginPath ();
            g.arc( 50 + ((nowX * boardOneSize)), 50 + ((nowY * boardOneSize)), boardOneSize/3, 0 * Math.PI / 180, 360 * Math.PI / 180, false );
            g.fillStyle = playerColor[nowPiece[panelPoint]];
            g.fill();
        }
        nowBoardSize = [Math.floor((nowX+1)*boardOneSize), Math.floor((nowY+1)*boardOneSize)];
        nowX++;
    }
}