let roomPassword = "0000";
let numberButtonXy = {
    1: {x: null, y: null},
    2: {x: null, y: null},
    3: {x: null, y: null},
    4: {x: null, y: null},
    5: {x: null, y: null},
    6: {x: null, y: null},
    7: {x: null, y: null},
    8: {x: null, y: null},
    9: {x: null, y: null},
    0: {x: null, y: null}
}
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
    // ルームキー入力部分
    g.font = `${sizeWH/22}pt Arial`;
    g.fillStyle = 'rgba(200, 200, 200)';
    g.fillText(`ルームキー`, canvas.width/2, canvas.height/4.5);
    drawSq((canvas.width/2)/1.7, canvas.height/3.2, (canvas.width/2)/1.2, canvas.height/5, 20, "rgba(243, 243, 243)");
    // ルームキー表示
    g.beginPath();
    g.font = `${sizeWH/8}pt Arial`;
    g.fillStyle = 'rgba(0,0,0)';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(roomPassword, canvas.width/2, canvas.height/2.4);
    let roomKeyWidth = g.measureText(roomPassword).width;
    // ルームキー現在位置の表示
    g.beginPath();
    g.fillStyle = "rgba(0, 0, 0, 0.5)";
    g.fillRect(canvas.width/2+(roomKeyWidth/4)*(keyInputCount-2), canvas.height/2.1, (roomKeyWidth/4)-(sizeWH/290), sizeWH/45);
    // 数字入力ボタン
    let numberButtonWH = (sizeWH/4);
    let numberButtonOneWH = (sizeWH)/10;
    for (let i = 0; i < 10; i++) {
        let drawBoxX = numberButtonWH+(numberButtonOneWH*i)+((numberButtonOneWH/15)*i);
        let drawBoxY = canvas.height/1.7;
        drawSq(drawBoxX, drawBoxY, numberButtonOneWH, numberButtonOneWH, 20, "rgba(243, 243, 243)");
        g.beginPath();
        g.font = `${sizeWH/14}pt Arial`;
        g.fillStyle = 'rgba(0,0,0)';
        g.textAlign = "left";
        g.textBaseline = "top";
        g.fillText(String(i), drawBoxX + (numberButtonOneWH/4.5), drawBoxY + (numberButtonOneWH/9));
    }
    // マッチングボタン
    //drawSq((canvas.width/2)/1.7, canvas.height/2.5, (canvas.width/2)/1.2, canvas.height/5, 20, "rgba(243, 243, 243)");
}

/*
 キーボード入力処理
 */
let keyUpIs = true;
let keyInputCount = 0;
document.addEventListener('keypress', keyPressEvent);
document.addEventListener('keyup', keyUpEvent);

function keyPressEvent(e) {
    if (!keyUpIs) return;
    if (isNaN(e.key)) return;
    roomPassword = roomPassword.substr(0, keyInputCount) + e.key + roomPassword.substr(keyInputCount+1);
    keyInputCount++;
    if (keyInputCount>=4) keyInputCount = 0;
    startMenuShow();
    return false;
}

function keyUpEvent(e) {
    keyUpIs = true;
    return false;
}

/*
 角丸四角
 */
function drawSq(x,y,w,h,r,color) {
    g.beginPath();
    g.lineWidth = 1;
    g.strokeStyle = color;
    g.fillStyle = color;
    g.moveTo(x,y + r);
    g.arc(x+r,y+h-r,r,Math.PI,Math.PI*0.5,true);
    g.arc(x+w-r,y+h-r,r,Math.PI*0.5,0,true);
    g.arc(x+w-r,y+r,r,0,Math.PI*1.5,true);
    g.arc(x+r,y+r,r,Math.PI*1.5,Math.PI,true);
    g.closePath();
    g.stroke();
    g.fill();
}