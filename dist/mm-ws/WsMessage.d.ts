export interface GenericMessageData {
    id?: string;
    type?: string;
    room?: string;
    payload?: any;
}
export interface WsMessageData extends GenericMessageData {
    expectsResponse?: boolean;
}
/**
 * Simple value object with factory... nothing fancy
 */
export declare class WsMessage {
    protected _payload: any;
    protected _type: string;
    protected _room: string | number;
    protected _id: string;
    expectsResponse: boolean;
    static readonly TYPE_JOIN_ROOM = "JOIN";
    static readonly TYPE_LEAVE_ROOM = "LEAVE";
    static readonly TYPE_BROADCAST = "BROADCAST";
    static readonly TYPE_ECHO = "ECHO";
    static readonly TYPE_HEARTBEAT = "HEARTBEAT";
    static readonly TYPE_RECONNECT = "RECONNECT";
    static readonly TYPE_CONNECTION_ESTABLISHED = "CONNECTION_ESTABLISHED";
    static readonly TYPE_JSONAPI = "JSONAPI";
    static readonly TYPE_JSONAPI_UPDATE = "JSONAPI_UPDATE";
    static readonly TYPE_JSONAPI_DELETE = "JSONAPI_DELETE";
    constructor(_payload: any, _type?: string, // join / leave
    _room?: string | number, _id?: string, expectsResponse?: boolean);
    static factory(data: string | WsMessageData): WsMessage;
    static stringify(data: WsMessageData): string;
    stringify(): string;
    readonly id: string;
    readonly payload: any;
    readonly parsedPayload: any;
    readonly type: string;
    readonly room: string;
    readonly isBroadcast: boolean;
    readonly isJoin: boolean;
    readonly isLeave: boolean;
    readonly isEcho: boolean;
    readonly isReconnect: boolean;
    readonly isHeartbeat: boolean;
    readonly isConnectionEstablished: boolean;
    toJSON(): {
        payload: any;
        type: string;
        room: string;
        id: string;
        expectsResponse: boolean;
    };
}
