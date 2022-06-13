let wrapper = null;	// キャンバスの親要素
let canvas = null;	// キャンバス
let g = null; // コンテキスト
let $id = function(id){ return document.getElementById(id); }; // DOM取得用
let boardLength = 8; // オセロボードの横・縦の数
let boardOneSize = 0; // オセロボードの一つ当たりの大きさ

/*
 キャンバスのサイズをウインドウに合わせて変更
 */
function getSize(){
    // キャンバスのサイズを再設定
    canvas.width = wrapper.offsetWidth;
    canvas.height =  wrapper.offsetHeight;
    boardOneSize = ((canvas.width/2.5) / boardLength);
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

    // キャンバスをウインドウサイズにする
    getSize();
});

/*
 オセロのキャンバスを作る
 */
function drawOthelloCanvas () {
    g.fillStyle = "rgb(56, 118, 29)";
    let nowX = 0;
    let nowY = 0;
    for (let i = 0; i < boardLength*boardLength; i++) {
        if (nowX >= boardLength) {

        }
        g.fillRect(30+(nowX*i), 30+(nowY*i), (boardOneSize-5), (boardOneSize-5));
    }
}