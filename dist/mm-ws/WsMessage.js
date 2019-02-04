"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mm_ts_utils_1 = require("mm-ts-utils");
/**
 * Simple value object with factory... nothing fancy
 */
var WsMessage = /** @class */ (function () {
    function WsMessage(_payload, _type, // join / leave
    _room, _id, expectsResponse) {
        if (_type === void 0) { _type = null; }
        if (_room === void 0) { _room = null; }
        if (_id === void 0) { _id = null; }
        if (expectsResponse === void 0) { expectsResponse = void 0; }
        this._payload = _payload;
        this._type = _type;
        this._room = _room;
        this._id = _id;
        this.expectsResponse = expectsResponse;
        if (!this._id) {
            this._id = mm_ts_utils_1.mmUid();
        }
    }
    WsMessage.factory = function (data) {
        var parsed;
        if (typeof data === 'string') {
            try {
                parsed = JSON.parse(data);
            }
            catch (e) {
                return new WsMessage(data.toString());
            }
        }
        else {
            parsed = data;
        }
        var payload = parsed.payload, type = parsed.type, room = parsed.room, id = parsed.id, expectsResponse = parsed.expectsResponse;
        // parsed ok, but still if all are undefined, consider it as unknown
        if (![payload, type, room, id, expectsResponse].some(function (v) { return v !== void 0; })) {
            return new WsMessage(data.toString());
        }
        return new WsMessage(payload, type, room, id, expectsResponse);
    };
    // type sugar
    WsMessage.stringify = function (data) {
        if (!data.id) {
            data.id = mm_ts_utils_1.mmUid();
        }
        return JSON.stringify(data);
    };
    WsMessage.prototype.stringify = function () {
        return JSON.stringify(this.toJSON());
    };
    Object.defineProperty(WsMessage.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "payload", {
        get: function () {
            return this._payload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "parsedPayload", {
        get: function () {
            try {
                return JSON.parse(this.payload);
            }
            catch (e) {
                return {};
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "type", {
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "room", {
        get: function () {
            return this._room ? "" + this._room : '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isBroadcast", {
        get: function () {
            return WsMessage.TYPE_BROADCAST === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isJoin", {
        get: function () {
            return WsMessage.TYPE_JOIN_ROOM === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isLeave", {
        get: function () {
            return WsMessage.TYPE_LEAVE_ROOM === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isEcho", {
        get: function () {
            return WsMessage.TYPE_ECHO === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isReconnect", {
        get: function () {
            return WsMessage.TYPE_RECONNECT === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isHeartbeat", {
        get: function () {
            return WsMessage.TYPE_HEARTBEAT === this.type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WsMessage.prototype, "isConnectionEstablished", {
        get: function () {
            return WsMessage.TYPE_CONNECTION_ESTABLISHED === this.type;
        },
        enumerable: true,
        configurable: true
    });
    WsMessage.prototype.toJSON = function () {
        return {
            payload: this.payload,
            type: this.type,
            room: this.room,
            id: this.id,
            expectsResponse: this.expectsResponse ? true : void 0,
        };
    };
    // "system" types
    WsMessage.TYPE_JOIN_ROOM = 'JOIN';
    WsMessage.TYPE_LEAVE_ROOM = 'LEAVE';
    WsMessage.TYPE_BROADCAST = 'BROADCAST';
    WsMessage.TYPE_ECHO = 'ECHO';
    WsMessage.TYPE_HEARTBEAT = 'HEARTBEAT';
    WsMessage.TYPE_RECONNECT = 'RECONNECT';
    WsMessage.TYPE_CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED';
    // "app" types... hm... (smells too narrow...)
    WsMessage.TYPE_JSONAPI = 'JSONAPI';
    WsMessage.TYPE_JSONAPI_UPDATE = 'JSONAPI_UPDATE';
    WsMessage.TYPE_JSONAPI_DELETE = 'JSONAPI_DELETE';
    return WsMessage;
}());
exports.WsMessage = WsMessage;
