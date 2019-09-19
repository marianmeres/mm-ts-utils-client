"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var eventemitter3_1 = __importDefault(require("eventemitter3"));
var WsMessage_1 = require("./WsMessage");
/**
 * inspired by:
 * https://github.com/stepchowfun/socket.js/blob/master/client/socket.js
 * https://github.com/pladaria/reconnecting-websocket/blob/master/reconnecting-websocket.ts
 */
var isFn = function (v) { return typeof v === 'function'; };
var isWebSocket = function (w) { return typeof w === 'function' && w.CLOSING === 2; };
var WsClient = /** @class */ (function (_super) {
    __extends(WsClient, _super);
    /**
     * @param _url
     * @param options
     */
    function WsClient(_url, options) {
        var _this = _super.call(this) || this;
        _this._url = _url;
        _this.options = options;
        _this.logger = console.log;
        _this.debug = false;
        _this.reconnectDataProvider = null;
        _this._wasDisconnected = false;
        _this._queue = []; // outgoing message queue
        _this._reconnectTimer = 0;
        _this._retryCounter = 0;
        _this._retryLimit = 0;
        _this._nextDelay = 1000; // default, overide via options
        //
        _this._joinedRooms = new Map();
        // internal flag to avoid rejoins if not needed (connection was not broken)
        _this._rejoinNeeded = false;
        _this.options = _this.options || {};
        // options mapped to mutable public props
        ['logger', 'debug', 'reconnectDataProvider'].forEach(function (k) {
            if (_this.options[k] !== void 0) {
                _this[k] = _this.options[k];
            }
        });
        // options mapped to private props
        if (_this.options.retryLimit !== void 0) {
            _this._retryLimit = parseInt("" + _this.options.retryLimit, 10);
            if (isNaN(_this._retryLimit)) {
                _this._retryLimit = 0;
            }
        }
        // not sure if these bindings are really needed...
        _this._onopen = _this._onopen.bind(_this);
        _this._onclose = _this._onclose.bind(_this);
        _this._onerror = _this._onerror.bind(_this);
        _this._onmessage = _this._onmessage.bind(_this);
        _this._factoryConnection = _this._factoryConnection.bind(_this);
        // feature!
        _this.on(WsClient.EVENT_RECONNECT_OPEN, _this.rejoinAllRooms.bind(_this));
        // try to connect immediatelly
        _this._connection = _this._factoryConnection();
        return _this;
    }
    Object.defineProperty(WsClient.prototype, "cid", {
        /**
         * will be set on server's first successfull TYPE_CONNECTION_ESTABLISHED message
         */
        get: function () {
            // if (!this._cid) { this._cid = mmUid(); } // do not auto generate
            return this._cid;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param args
     */
    WsClient.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.debug && isFn(this.logger)) {
            this.logger.apply(this, args);
        }
    };
    Object.defineProperty(WsClient.prototype, "connection", {
        /**
         * idea is, that the 'native' WebSocket instance should be considered low-level
         * and not really be used directly unless needed...
         */
        get: function () {
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    /**
     *
     */
    WsClient.prototype.clearQueue = function () {
        if (this._queue.length) {
            return this._queue.splice(0, this._queue.length).length;
        }
        return 0;
    };
    /**
     * @private
     */
    WsClient.prototype._factoryConnection = function () {
        var conn = new WebSocket(this._url);
        conn.onopen = this._onopen;
        conn.onclose = this._onclose;
        conn.onerror = this._onerror;
        conn.onmessage = this._onmessage;
        return conn;
    };
    /**
     * @param e
     * @private
     */
    WsClient.prototype._onopen = function (e) {
        var reconnect = false;
        this._nextDelay = 1000; // reset
        // if we are reconnecting...
        if (this._wasDisconnected) {
            this._wasDisconnected = false;
            reconnect = true;
            // is this a good idea? (can cause significant server load issues under
            // certain circumstances)
            this.clearQueue();
            // notify the application and gather any context to send to the server
            var reconnectData = isFn(this.reconnectDataProvider)
                ? this.reconnectDataProvider()
                : void 0;
            // 'reconnect' message info to server
            this._queue.push({
                type: WsMessage_1.WsMessage.TYPE_RECONNECT,
                payload: reconnectData,
            });
        }
        this.emit(WsClient.EVENT_OPEN, e);
        reconnect && this.emit(WsClient.EVENT_RECONNECT_OPEN, e);
        this._flushQueue();
    };
    /**
     * NOTE: every close is in this package considered as 'not clean' (network error etc...)
     * @param e
     * @private
     */
    WsClient.prototype._onclose = function (e) {
        var _this = this;
        this.emit(WsClient.EVENT_CLOSE, e);
        this._wasDisconnected = true;
        this._rejoinNeeded = true;
        // just in case... hm...
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
        }
        var doRetry;
        // 0 -> no limit
        if (this._retryLimit === 0) {
            doRetry = true;
        }
        // negative -> no retry
        else if (this._retryLimit < 0) {
            doRetry = false;
        }
        // positive -> maybe retry (respect the limit)
        else {
            doRetry = this._retryLimit >= this._retryCounter++;
        }
        if (doRetry) {
            var nextDelay = this._getReconnectDelay();
            this.emit(WsClient.EVENT_RECONNECT_SCHEDULING, nextDelay);
            this._reconnectTimer = setTimeout(function () {
                _this.emit(WsClient.EVENT_RECONNECTING);
                _this._connection = _this._factoryConnection();
                _this._reconnectTimer = 0;
            }, nextDelay);
        }
    };
    /**
     * @param e
     * @private
     */
    WsClient.prototype._onerror = function (e) {
        this.emit(WsClient.EVENT_ERROR, e);
    };
    /**
     * @param e
     * @private
     */
    WsClient.prototype._onmessage = function (e) {
        //
        var m = WsMessage_1.WsMessage.factory(e.data);
        // FEATURE - server echos back id, so we can implement `onSuccess`
        if (m.isEcho &&
            m.payload &&
            m.payload.id &&
            WsClient._pendingCallbacks.has(m.payload.id)) {
            // call `onSuccess` handler with response (if provided)
            WsClient._pendingCallbacks.get(m.payload.id)(m.payload.response);
            WsClient._pendingCallbacks.delete(m.payload.id);
        }
        //
        else if (m.isConnectionEstablished) {
            this._cid = m.payload; // save client id... might be usefull maybe
        }
        this.emit(WsClient.EVENT_MESSAGE, e.data);
    };
    /**
     * @param event
     * @param args
     */
    WsClient.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.log(event, args);
        // maybe emit wilcard here as well?
        return _super.prototype.emit.apply(this, __spreadArrays([event], args));
    };
    /**
     * @param msg
     * @param onSuccess
     */
    WsClient.prototype.send = function (msg, onSuccess) {
        if (isFn(onSuccess)) {
            // IMPORTANT: if our `onSuccess` contains arguments, let's consider it
            // as request-response kind of message and signal to server that we
            // are expecting direct response (in the form of ECHO message with
            // `response` key in the payload)
            // NOTE: applicable only on WsMessage
            if (msg instanceof WsMessage_1.WsMessage) {
                msg.expectsResponse = onSuccess.length > 0;
            }
            try {
                var id = msg instanceof WsMessage_1.WsMessage ? msg.id : JSON.parse(msg).id;
                if (id) {
                    WsClient._pendingCallbacks.set(id, onSuccess);
                }
                else {
                    this.log('warning', 'Missing message id, ignoring `onSuccess`.');
                }
            }
            catch (e) {
                this.log('warning', 'Unknown message format, ignoring `onSuccess`.', e.toString());
            }
        }
        this._queue.push(msg instanceof WsMessage_1.WsMessage ? msg.stringify() : msg);
        this._flushQueue();
    };
    /**
     * @private
     */
    WsClient.prototype._flushQueue = function () {
        // note: it might be reasonable (but risky) to inspect the queue here
        // before actual send to remove dupes (or consider other heuristics...)
        if (this._queue.length && this.isOpen()) {
            for (var i = 0; i < this._queue.length; i++) {
                var msg = this._queue[i];
                if (typeof msg !== 'string') {
                    msg = WsMessage_1.WsMessage.stringify(msg);
                }
                // no-op for undefined messages
                if (msg !== void 0) {
                    this._connection.send(msg);
                    this.emit(WsClient.EVENT_SEND, msg);
                }
            }
            this.clearQueue();
        }
    };
    /**
     * @private
     */
    WsClient.prototype._getReconnectDelay = function () {
        var next;
        // providing custom option has priority...
        var delay = this.options.delay;
        if (delay) {
            next = isFn(delay) ? delay(this._retryLimit) : delay;
        }
        // default: throttle each repeat, but not more than 1 minute
        if (typeof next !== 'number') {
            this._nextDelay *= 1.25; // throttle factor
            this._nextDelay = Math.min(this._nextDelay, 60000);
            next = this._nextDelay;
        }
        return next;
    };
    /**
     * @param isJoin
     * @param room
     * @param cb
     * @private
     */
    WsClient.prototype._roomAction = function (isJoin, room, cb) {
        var _this = this;
        var doRoomAction = true;
        // if we're about to do the same roomAction without previous interruption
        // we may safely skip to save potential server overhead...
        if (!this._rejoinNeeded &&
            ((isJoin && this._joinedRooms.has(room)) ||
                (!isJoin && !this._joinedRooms.has(room)))) {
            doRoomAction = false;
        }
        if (!doRoomAction) {
            this.log("Skipping (unneeded) " + (isJoin ? 'JOIN' : 'LEAVE') + " for " + room);
        }
        // we don't need to check for `isOpen` because messages are queued in order
        // and will be flushed once connection becomes ready
        if (doRoomAction) {
            // && this.isOpen()
            this.send(WsMessage_1.WsMessage.stringify({
                type: isJoin ? WsMessage_1.WsMessage.TYPE_JOIN_ROOM : WsMessage_1.WsMessage.TYPE_LEAVE_ROOM,
                room: room,
            }), function () {
                // debug
                var isRejoin = isJoin && _this._joinedRooms.has(room);
                var joinLabel = (isRejoin ? 'RE-' : '') + 'JOINED';
                _this.log(_this.cid + " " + (isJoin ? joinLabel : 'LEFT') + " ROOM " + room);
                // save (!important)
                isJoin
                    ? _this._joinedRooms.set(room, true)
                    : _this._joinedRooms.delete(room);
                //
                isFn(cb) && cb(room, isJoin);
            });
        }
    };
    /**
     * @param room
     * @param cb
     */
    WsClient.prototype.joinRoom = function (room, cb) {
        var _this = this;
        this.onReady(function () { return _this._roomAction(true, room, cb); });
    };
    WsClient.prototype.isJoined = function (room) {
        return this._joinedRooms.has(room);
    };
    /**
     * @param room
     * @param cb
     */
    WsClient.prototype.leaveRoom = function (room, cb) {
        var _this = this;
        this.onReady(function () { return _this._roomAction(false, room, cb); });
    };
    /**
     * Important on reconnect!
     * @param cb
     */
    WsClient.prototype.rejoinAllRooms = function (cb) {
        var _this = this;
        if (this._rejoinNeeded) {
            this._joinedRooms.forEach(function (val, key) { return _this.joinRoom(key, cb); });
            this._rejoinNeeded = false;
        }
    };
    Object.defineProperty(WsClient.prototype, "joinedRooms", {
        /**
         *
         */
        get: function () {
            return this._joinedRooms;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param cb
     */
    WsClient.prototype.onReady = function (cb) {
        if (!isFn(cb)) {
            return;
        }
        if (this.isOpen()) {
            cb();
        }
        else {
            this.on(WsClient.EVENT_OPEN, cb); // or `once` ?
        }
    };
    /**
     * only sugar below
     */
    /**
     *
     */
    WsClient.prototype.isOpen = function () {
        return this.connection.readyState === WsClient.READYSTATE_OPEN;
    };
    /**
     * @param cb
     */
    WsClient.prototype.onOpen = function (cb) {
        this.on(WsClient.EVENT_OPEN, cb);
    };
    /**
     * @param cb
     */
    WsClient.prototype.onClose = function (cb) {
        this.on(WsClient.EVENT_CLOSE, cb);
    };
    /**
     * @param cb
     */
    WsClient.prototype.onError = function (cb) {
        this.on(WsClient.EVENT_ERROR, cb);
    };
    /**
     * sugar
     * @param cb
     */
    WsClient.prototype.onMessage = function (cb) {
        this.on(WsClient.EVENT_MESSAGE, cb);
    };
    // WebSocket events
    WsClient.EVENT_OPEN = 'open';
    WsClient.EVENT_ERROR = 'error';
    WsClient.EVENT_CLOSE = 'close';
    WsClient.EVENT_MESSAGE = 'message';
    // custom WsClient events...
    WsClient.EVENT_RECONNECT_SCHEDULING = 'reconnect_scheduling';
    WsClient.EVENT_RECONNECTING = 'reconnecting';
    WsClient.EVENT_RECONNECT_OPEN = 'reconnect_open';
    WsClient.EVENT_SEND = 'send';
    // WebSocket readystate values
    WsClient.READYSTATE_CONNECTING = 0;
    WsClient.READYSTATE_OPEN = 1;
    WsClient.READYSTATE_CLOSING = 2;
    WsClient.READYSTATE_CLOSED = 3;
    // "once" map of `onSuccess` handlers...
    WsClient._pendingCallbacks = new Map();
    return WsClient;
}(eventemitter3_1.default));
exports.WsClient = WsClient;
