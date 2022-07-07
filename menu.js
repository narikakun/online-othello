let roomPassword = "0000";

/*
 スタート画面を出す
 */
function startMenuShow () {
    // キャンバスをリセット
    g.beginPath();
    g.fillStyle = "rgba(0, 0, 0)";
    g.fillRect(0, 0, canvas.width, canvas.height);
    // タイトル文字を出す
    g.beginPath();
    g.font = `${sizeWH/17}pt Arial`;
    g.fillStyle = 'rgba(255, 255, 255)';
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillText(`オンラインオセロゲーム`, canvas.width/2, canvas.height/10);
}