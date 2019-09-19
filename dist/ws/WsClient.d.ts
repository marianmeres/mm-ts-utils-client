import EventEmitter from 'eventemitter3';
import { WsMessage, WsMessageData } from './WsMessage';
export interface WsClientOptions {
    debug?: boolean;
    logger?: (...args: any[]) => any | null;
    reconnectDataProvider?: () => any | null;
    retryLimit?: number;
    delay?: number | ((retryCounter: number) => number);
}
export declare class WsClient extends EventEmitter {
    protected _url: string;
    readonly options?: WsClientOptions;
    static readonly EVENT_OPEN = "open";
    static readonly EVENT_ERROR = "error";
    static readonly EVENT_CLOSE = "close";
    static readonly EVENT_MESSAGE = "message";
    static readonly EVENT_RECONNECT_SCHEDULING = "reconnect_scheduling";
    static readonly EVENT_RECONNECTING = "reconnecting";
    static readonly EVENT_RECONNECT_OPEN = "reconnect_open";
    static readonly EVENT_SEND = "send";
    static readonly READYSTATE_CONNECTING = 0;
    static readonly READYSTATE_OPEN = 1;
    static readonly READYSTATE_CLOSING = 2;
    static readonly READYSTATE_CLOSED = 3;
    logger: {
        (message?: any, ...optionalParams: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    debug: boolean;
    reconnectDataProvider: (() => any) | null;
    protected _connection: WebSocket;
    protected _wasDisconnected: boolean;
    protected _queue: Array<WsMessageData | string>;
    protected _reconnectTimer: number;
    protected _retryCounter: number;
    protected _retryLimit: number;
    protected _nextDelay: number;
    protected static _pendingCallbacks: Map<any, any>;
    protected _cid: any;
    protected _joinedRooms: Map<any, any>;
    protected _rejoinNeeded: boolean;
    /**
     * @param _url
     * @param options
     */
    constructor(_url: string, options?: WsClientOptions);
    /**
     * will be set on server's first successfull TYPE_CONNECTION_ESTABLISHED message
     */
    readonly cid: any;
    /**
     * @param args
     */
    log(...args: any[]): void;
    /**
     * idea is, that the 'native' WebSocket instance should be considered low-level
     * and not really be used directly unless needed...
     */
    readonly connection: WebSocket;
    /**
     *
     */
    clearQueue(): number;
    /**
     * @private
     */
    _factoryConnection(): WebSocket;
    /**
     * @param e
     * @private
     */
    _onopen(e: any): void;
    /**
     * NOTE: every close is in this package considered as 'not clean' (network error etc...)
     * @param e
     * @private
     */
    _onclose(e: any): void;
    /**
     * @param e
     * @private
     */
    _onerror(e: any): void;
    /**
     * @param e
     * @private
     */
    _onmessage(e: any): void;
    /**
     * @param event
     * @param args
     */
    emit(event: any, ...args: any[]): boolean;
    /**
     * @param msg
     * @param onSuccess
     */
    send(msg: string | WsMessage, onSuccess?: (some?: any) => any): void;
    /**
     * @private
     */
    _flushQueue(): void;
    /**
     * @private
     */
    _getReconnectDelay(): any;
    /**
     * @param isJoin
     * @param room
     * @param cb
     * @private
     */
    protected _roomAction(isJoin: boolean, room: any, cb?: any): void;
    /**
     * @param room
     * @param cb
     */
    joinRoom(room: any, cb?: any): void;
    isJoined(room: any): boolean;
    /**
     * @param room
     * @param cb
     */
    leaveRoom(room: any, cb?: any): void;
    /**
     * Important on reconnect!
     * @param cb
     */
    rejoinAllRooms(cb?: any): void;
    /**
     *
     */
    readonly joinedRooms: Map<any, any>;
    /**
     * @param cb
     */
    onReady(cb: any): void;
    /**
     * only sugar below
     */
    /**
     *
     */
    isOpen(): boolean;
    /**
     * @param cb
     */
    onOpen(cb: (e: any) => any): void;
    /**
     * @param cb
     */
    onClose(cb: (e: any) => any): void;
    /**
     * @param cb
     */
    onError(cb: (e: any) => any): void;
    /**
     * sugar
     * @param cb
     */
    onMessage(cb: (data: any) => any): void;
}
