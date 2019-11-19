"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var http = require("http");
var WsMessage_1 = require("./WsMessage");
var mm_ts_utils_1 = require("mm-ts-utils");
//
var _wsDebug = function (msg) { return console.log(msg); };
var isOpen = function (client) { return client.readyState === WebSocket.OPEN; };
var _notAllowedHostWarn = new Map();
/**
 * @param {"http".Server | number} serverOrPort
 * @param {WssInitOptions} options
 * @returns {WebSocket.Server}
 */
exports.createWss = function (serverOrPort, options) {
    options = Object.assign(
    // merge defaults with provided
    { autoReconnectInterval: 5000 }, options || {});
    var args = {};
    if (serverOrPort instanceof http.Server) {
        args.server = serverOrPort;
    }
    else {
        args.port = serverOrPort;
    }
    args.path = args.path === void 0 ? '/ws/' : args.path; // hard default
    var wss = new WebSocket.Server(args);
    var clog = options.logger || (function () { return void 0; });
    // debug
    if (args.port) {
        clog("WebSocket.Server listening on " + args.port + "...");
    }
    else {
        clog("WebSocket.Server listening on http.Server's port...");
    }
    //
    wss.on('connection', function (ws, req) {
        // console.log(req.headers, req.connection.remoteAddress);
        if (options.originWhitelist && options.originWhitelist.length) {
            var origin_1 = req.headers.origin;
            if (origin_1 && -1 === options.originWhitelist.indexOf(origin_1)) {
                if (!_notAllowedHostWarn.has(origin_1)) {
                    _notAllowedHostWarn.set(origin_1, true);
                    console.error("Origin " + origin_1 + " not allowed. Ignoring...");
                }
                ws.close();
                return;
            }
        }
        // initialize client
        // 1.
        ws.cid = mm_ts_utils_1.mmGetRandomStr({ length: 16 /*, prefix: 'ws_' */ });
        // 2.
        ws.rooms = new Map();
        // 3.
        if (req.headers['x-forwarded-for']) {
            ws.ip = req.headers['x-forwarded-for'].toString();
        }
        else if (req.connection.remoteAddress) {
            ws.ip = req.connection.remoteAddress;
        }
        //
        // _wsDebug(`Client ${ws.cid} connected from ${ws.ip}...`);
        isOpen(ws) &&
            ws.send(WsMessage_1.WsMessage.stringify({
                payload: ws.cid,
                type: WsMessage_1.WsMessage.TYPE_CONNECTION_ESTABLISHED,
            }), function (err) {
                if (err) {
                    console.error(err);
                }
            });
        // ping/pong PART 1
        ws.isAlive = true;
        ws.on('pong', function () {
            ws.isAlive = true;
        });
        // main message handler
        ws.on('message', function (data) {
            var msg = WsMessage_1.WsMessage.factory(data);
            // join?
            if (msg.isJoin) {
                ws.rooms.set(msg.room, true);
                wss.emit(WsMessage_1.WsMessage.TYPE_JOIN_ROOM, msg, ws, req);
                wss.emit("all", msg, ws, req);
            }
            // leave?
            else if (msg.isLeave) {
                var res = ws.rooms.delete(msg.room);
                wss.emit(WsMessage_1.WsMessage.TYPE_LEAVE_ROOM, msg, ws, req, res);
                wss.emit("all", msg, ws, req, res);
            }
            // broadcast?
            else if (msg.isBroadcast) {
                exports.wsSend(wss, msg, ws);
                wss.emit(WsMessage_1.WsMessage.TYPE_BROADCAST, msg, ws, req);
                wss.emit("all", msg, ws, req);
            }
            // heartbeat?
            else if (msg.isHeartbeat) {
                wss.emit(WsMessage_1.WsMessage.TYPE_HEARTBEAT, msg, ws, req);
                wss.emit("all", msg, ws, req); // hm... chceme heartbeat aj medzi all?
            }
            else if (msg.isReconnect) {
                wss.emit(WsMessage_1.WsMessage.TYPE_RECONNECT, msg, ws, req);
                wss.emit("all", msg, ws, req);
            }
            // `default` or unknown type...
            else {
                wss.emit("message", msg, ws, req);
                wss.emit("all", msg, ws, req);
            }
            // always echo back (use the original message id as payload), so we can
            // implement `onSuccess` callbacks
            // UNLESS msg.expectResponse is true - in that case, leave that
            // responsibility on the handler
            if (!msg.expectsResponse) {
                isOpen(ws) &&
                    ws.send(WsMessage_1.WsMessage.stringify({
                        payload: { id: msg.id },
                        type: WsMessage_1.WsMessage.TYPE_ECHO,
                    }));
            }
        });
        // https://github.com/websockets/ws/issues/1256
        ws.on('error', function (e) {
            // Ignore network errors like `ECONNRESET`, `EPIPE`, etc.
            if (e.errno) {
                return;
            }
            console.error("ws: " + e.toString());
        });
        ws.on('close', function () {
            ws.isAlive = false; // treba toto?
            // _wsDebug(`Client ${ws.cid} disconnected...`);
        });
    });
    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
    // ping/pong PART 2
    setInterval(function () {
        wss.clients.forEach(function (ws) {
            if (isOpen(ws)) {
                // adding...
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping(null, void 0);
            }
        });
    }, options.autoReconnectInterval);
    // hm...
    wss.on('error', function (e) {
        console.log("Websocket.Server " + e.toString());
    });
    return wss;
};
/*********************************************************************************
 * helpers
 ********************************************************************************/
/**
 * @param {WebSocket.Server} wss
 * @param {WsMessage} msg
 * @param {WebSocket} ws
 */
exports.wsSend = function (wss, msg, ws) {
    if (ws === void 0) { ws = null; }
    // empty room `` is considered "force to all"... subject of change...
    var forceToAllRooms = msg.room === '';
    // _wsDebug(`BROADCAST to ${forceToAllRooms ? 'all' : msg.room}`);
    wss.clients.forEach(function (client) {
        if (client !== ws &&
            isOpen(client) &&
            // target by room id (to all in the room) or client id (directly, privately to one client)
            // or to all if room is '' (empty)
            (forceToAllRooms || client.cid === msg.room || client.rooms.has(msg.room))) {
            client.send(msg.stringify());
        }
    });
};
// sugar
exports.wsSendPayloadToRoom = function (wss, payload, room, type) {
    if (type === void 0) { type = null; }
    if (!Array.isArray(room)) {
        room = [room];
    }
    room.forEach(function (r) { return exports.wsSend(wss, WsMessage_1.WsMessage.factory({ payload: payload, room: r, type: type })); });
};
// sugar
exports.wsSendPayloadToAll = function (wss, payload, type) {
    if (type === void 0) { type = null; }
    return exports.wsSend(wss, WsMessage_1.WsMessage.factory({ payload: payload, room: '', type: type }));
};
// sugar
exports.wsSendJsonApiToRoom = function (wss, payload, room) {
    return exports.wsSendPayloadToRoom(wss, JSON.stringify(payload), room, WsMessage_1.WsMessage.TYPE_JSONAPI);
};
// sugar
exports.wsSendJsonApiUpdateToRoom = function (wss, payload, room) {
    return exports.wsSendPayloadToRoom(wss, JSON.stringify(payload), room, WsMessage_1.WsMessage.TYPE_JSONAPI_UPDATE);
};
// sugar
exports.wsSendJsonApiDeleteToRoom = function (wss, payload, room) {
    return exports.wsSendPayloadToRoom(wss, JSON.stringify(payload), room, WsMessage_1.WsMessage.TYPE_JSONAPI_DELETE);
};
