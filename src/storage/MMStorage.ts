const _isFunction = (obj) => {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};

/**
 * few utilities on top of session/localStorage:
 * - normalized values de/serialization
 * - expiration features ("valid until")
 * - auto namespace prefix
 */
export class MMStorage {
    protected _storage: Storage;

    logger;

    /**
     * @param _prefix
     * @param isSession
     * @param _defaultTtlMs
     */
    constructor(
        protected _prefix: string,
        isSession = false,
        protected _defaultTtlMs: number = 0
    ) {
        if (isSession) {
            this._storage = window.sessionStorage;
        } else {
            this._storage = window.localStorage;
        }
    }

    /**
     * @param msg
     */
    log(msg) {
        _isFunction(this.logger) && this.logger(msg);
    }

    /**
     * API for direct access to underlying storage
     * @returns {Storage}
     */
    get native(): Storage {
        return this._storage;
    }

    /**
     * @param key
     * @param val
     */
    setItemNative(key, val) {
        try {
            this.native.setItem(key, val);
        } catch (e) {
            console.error(e);
            this.log(`!setItem(${key}) ${e}`);
        }
    }

    /**
     * @param key
     * @returns {string|null}
     */
    getItemNative(key) {
        return this.native.getItem(key);
    }

    /**
     * @param key
     * @param val
     * @param ttlMs
     * @returns {MMStorage}
     */
    setItem(key, val, ttlMs: number = null) {
        if (ttlMs === null) {
            ttlMs = this._defaultTtlMs;
        }
        try {
            this._storage.setItem(
                this._key(key),
                JSON.stringify({
                    _validUntil: ttlMs ? new Date(Date.now() + ttlMs) : 0,
                    payload: val,
                })
            );
        } catch (e) {
            console.error(e);
            this.log(`!setItem(${key}) ${e}`);
            if (/quota/i.test(e)) {
                this.removeExpired();
            } // too naive?
        }
        return this;
    }

    /**
     * @param key
     * @param fallbackValue
     * @returns {any}
     */
    getItem(key, fallbackValue = null) {
        key = this._key(key);
        let val: any = this._storage.getItem(key);
        if (null === val) {
            return val;
        } // not found
        try {
            val = JSON.parse(val);

            if (!val || val.payload === void 0 || val._validUntil === void 0) {
                // wrong format?
                this._storage.removeItem(key);
                return null;
            }

            // 0 = valid always
            if (val._validUntil && new Date(val._validUntil) < new Date()) {
                this._storage.removeItem(key);
                return null;
            }

            val = val.payload;

            if (val === null && fallbackValue !== void 0) {
                // val = null is legit
                val = fallbackValue;
            }
            return val;
        } catch (e) {
            // corrupted json?
            console.error(e);
            this.log(`!getItem(${key}) ${e}`);
        }

        return null;
    }

    /**
     * @param key
     * @returns {MMStorage}
     */
    removeItem(key) {
        this._storage.removeItem(this._key(key));
        return this;
    }

    /**
     * @returns {MMStorage}
     */
    removeAll() {
        this._storage.clear();
        return this;
    }

    /**
     *
     */
    removeExpired() {
        this.log(`removeExpired()`);
        for (let i = 0, len = this._storage.length; i < len; ++i) {
            let key = this._storage.key(i);
            this.getItem(key); // this cleans up
        }
    }

    /**
     * @param rgxStr
     * @param prefix
     * @returns {number}
     */
    removeMatching(rgxStr, prefix = null) {
        if (prefix === null) {
            prefix = this._prefix;
        }
        let rx = new RegExp(
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
            '^' + (prefix + rgxStr).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
        );
        // console.log(rx);
        let counter = 0;
        for (let i = 0; i < this._storage.length; ++i) {
            let key = this._storage.key(i);
            if (rx.test(key)) {
                this._storage.removeItem(key);
                counter++;
                i--; // because removeItem has just shortened the length
            }
        }
        return counter;
    }

    /**
     * @param key
     * @returns {string}
     * @private
     */
    protected _key(key) {
        return this._prefix + key;
    }
}
