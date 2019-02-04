import { mmUid } from 'mm-ts-utils';

export interface GenericMessageData {
    id?: string;
    type?: string;
    room?: string; // a.k.a. namespace
    payload?: any;
}

export interface WsMessageData extends GenericMessageData {
    expectsResponse?: boolean;
}

/**
 * Simple value object with factory... nothing fancy
 */
export class WsMessage {
    // "system" types
    static readonly TYPE_JOIN_ROOM = 'JOIN';
    static readonly TYPE_LEAVE_ROOM = 'LEAVE';
    static readonly TYPE_BROADCAST = 'BROADCAST';
    static readonly TYPE_ECHO = 'ECHO';
    static readonly TYPE_HEARTBEAT = 'HEARTBEAT';
    static readonly TYPE_RECONNECT = 'RECONNECT';
    static readonly TYPE_CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED';

    // "app" types... hm... (smells too narrow...)
    static readonly TYPE_JSONAPI = 'JSONAPI';
    static readonly TYPE_JSONAPI_UPDATE = 'JSONAPI_UPDATE';
    static readonly TYPE_JSONAPI_DELETE = 'JSONAPI_DELETE';

    constructor(
        protected _payload: any,
        protected _type: string = null, // join / leave
        protected _room: string | number = null,
        protected _id: string = null,
        public expectsResponse: boolean = void 0
    ) {
        if (!this._id) {
            this._id = mmUid();
        }
    }

    static factory(data: string | WsMessageData): WsMessage {
        let parsed;

        if (typeof data === 'string') {
            try {
                parsed = JSON.parse(data);
            } catch (e) {
                return new WsMessage(data.toString());
            }
        } else {
            parsed = data;
        }

        let { payload, type, room, id, expectsResponse } = parsed;

        // parsed ok, but still if all are undefined, consider it as unknown
        if (
            ![payload, type, room, id, expectsResponse].some(
                (v) => v !== void 0
            )
        ) {
            return new WsMessage(data.toString());
        }

        return new WsMessage(payload, type, room, id, expectsResponse);
    }

    // type sugar
    static stringify(data: WsMessageData) {
        if (!data.id) {
            data.id = mmUid();
        }
        return JSON.stringify(data);
    }

    stringify() {
        return JSON.stringify(this.toJSON());
    }

    get id() {
        return this._id;
    }

    get payload() {
        return this._payload;
    }

    get parsedPayload() {
        try {
            return JSON.parse(this.payload);
        } catch (e) {
            return {};
        }
    }

    get type() {
        return this._type;
    }

    get room() {
        return this._room ? `${this._room}` : '';
    }

    get isBroadcast() {
        return WsMessage.TYPE_BROADCAST === this.type;
    }

    get isJoin() {
        return WsMessage.TYPE_JOIN_ROOM === this.type;
    }

    get isLeave() {
        return WsMessage.TYPE_LEAVE_ROOM === this.type;
    }

    get isEcho() {
        return WsMessage.TYPE_ECHO === this.type;
    }

    get isReconnect() {
        return WsMessage.TYPE_RECONNECT === this.type;
    }

    get isHeartbeat() {
        return WsMessage.TYPE_HEARTBEAT === this.type;
    }

    get isConnectionEstablished() {
        return WsMessage.TYPE_CONNECTION_ESTABLISHED === this.type;
    }

    toJSON() {
        return {
            payload: this.payload,
            type: this.type,
            room: this.room,
            id: this.id,
            expectsResponse: this.expectsResponse ? true : void 0,
        };
    }
}
