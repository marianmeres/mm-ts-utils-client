/**
 * few utilities on top of session/localStorage:
 * - normalized values de/serialization
 * - expiration features ("valid until")
 * - auto namespace prefix
 */
export declare class MMStorage {
    protected _prefix: string;
    protected _defaultTtlMs: number;
    protected _storage: Storage;
    logger: any;
    /**
     * @param _prefix
     * @param isSession
     * @param _defaultTtlMs
     */
    constructor(_prefix: string, isSession?: boolean, _defaultTtlMs?: number);
    /**
     * @param msg
     */
    log(msg: any): void;
    /**
     * API for direct access to underlying storage
     * @returns {Storage}
     */
    readonly native: Storage;
    /**
     * @param key
     * @param val
     */
    setItemNative(key: any, val: any): void;
    /**
     * @param key
     * @returns {string|null}
     */
    getItemNative(key: any): string;
    /**
     * @param key
     * @param val
     * @param ttlMs
     * @returns {MMStorage}
     */
    setItem(key: any, val: any, ttlMs?: number): this;
    /**
     * @param key
     * @param fallbackValue
     * @returns {any}
     */
    getItem(key: any, fallbackValue?: any): any;
    /**
     * @param key
     * @returns {MMStorage}
     */
    removeItem(key: any): this;
    /**
     * @returns {MMStorage}
     */
    removeAll(): this;
    /**
     *
     */
    removeExpired(): void;
    /**
     * @param rgxStr
     * @param prefix
     * @returns {number}
     */
    removeMatching(rgxStr: any, prefix?: any): number;
    /**
     * @param key
     * @returns {string}
     * @private
     */
    protected _key(key: any): string;
}
