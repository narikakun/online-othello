let WebSocketSettings = {
    ws: {
        url: "wss://cloud.achex.ca"
    }
}
//OsakaHumanManyMany
let _ws;
window.onload = function () {
    if (_ws) return;
    // WebSocketサーバーに接続
    document.getElementById( "s-statusmsg" ).textContent = "サーバーに接続中...";
    ws = new WebSocket(settings.ws.url);

    //接続通知
    ws.onopen = function(event) {
        document.getElementById( "s-statusmsg" ).textContent = "サーバーに接続しました。";
        //joinroom()
        //メッセージ受信
        ws.onmessage = function(event) {
            console.log(event.data);
            var data = JSON.parse(event.data, true);
            if (data.auth) {
                if (data.auth == "OK") {
                    ws.send(JSON.stringify({"joinHub": settings.room.key}))
                } else {
                    swal("エラー", "認証に失敗しました。", "error");
                    return;
                }
            }
            if (data.joinHub) {
                if (data.joinHub == "OK") {
                    all_hide();
                    document.getElementById("wait_ui").style = "display: block;";
                    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"join", "name":settings.user.name}));
                } else {
                    swal("エラー", "ルーム参加に失敗しました。", "error");
                    return;
                }
            }
            if (data.sendtype) {
                if (data.sendtype == "join") {
                    document.getElementById("wait_message").textContent = "対戦者が見つかりました。";
                    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"joinreplystart", "name":settings.user.name}));
                    document.getElementById("wait_user").textContent = data.name;
                    settings.room.host = false;
                    start_typing();
                }
                if (data.sendtype == "joinreplystart") {
                    document.getElementById("wait_message").textContent = "対戦者が見つかりました。";
                    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"startreplyok", "name":settings.user.name}));
                    document.getElementById("wait_user").textContent = data.name;
                    settings.room.host = true;
                    start_typing();
                }
                if (data.sendtype == "ping") {
                    settings.last_ping = new Date();
                }
                if (data.sendtype == "question") {
                    set_reibun(data.a1, data.a2);
                }
                if (data.sendtype == "typing_finish") {
                    if (settings.room.host) {
                        set_reibun();
                    }
                }
                if (data.sendtype == "typing_now") {
                    now_aite(data.str_hand, data.int_point);
                }
            }
            if (data.error) {
                swal("エラー", data.error, "error");
                return;
            }
        };

        //切断
        ws.onclose = function() {
            if (settings.er_msg) return;
            swal({
                title: "切断されました",
                text: "サーバーから切断されました。再接続するには、ページを再読み込みする必要があります。",
                icon: "error",
            });
            all_stop();
        };
    };

    //エラー発生
    ws.onerror = function(error) {
        console.error(error);
        swal({
            title: "サーバーエラー",
            text: "サーバーエラーが発生したため、終了しました。",
            icon: "error",
        });
        all_stop();
    };
};