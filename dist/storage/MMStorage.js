"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _isFunction = function (obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};
/**
 * few utilities on top of session/localStorage:
 * - normalized values de/serialization
 * - expiration features ("valid until")
 * - auto namespace prefix
 */
var MMStorage = /** @class */ (function () {
    /**
     * @param _prefix
     * @param isSession
     * @param _defaultTtlMs
     */
    function MMStorage(_prefix, isSession, _defaultTtlMs) {
        if (isSession === void 0) { isSession = false; }
        if (_defaultTtlMs === void 0) { _defaultTtlMs = 0; }
        this._prefix = _prefix;
        this._defaultTtlMs = _defaultTtlMs;
        if (isSession) {
            this._storage = window.sessionStorage;
        }
        else {
            this._storage = window.localStorage;
        }
    }
    /**
     * @param msg
     */
    MMStorage.prototype.log = function (msg) {
        _isFunction(this.logger) && this.logger(msg);
    };
    Object.defineProperty(MMStorage.prototype, "native", {
        /**
         * API for direct access to underlying storage
         * @returns {Storage}
         */
        get: function () {
            return this._storage;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param key
     * @param val
     */
    MMStorage.prototype.setItemNative = function (key, val) {
        try {
            this.native.setItem(key, val);
        }
        catch (e) {
            console.error(e);
            this.log("!setItem(" + key + ") " + e);
        }
    };
    /**
     * @param key
     * @returns {string|null}
     */
    MMStorage.prototype.getItemNative = function (key) {
        return this.native.getItem(key);
    };
    /**
     * @param key
     * @param val
     * @param ttlMs
     * @returns {MMStorage}
     */
    MMStorage.prototype.setItem = function (key, val, ttlMs) {
        if (ttlMs === void 0) { ttlMs = null; }
        if (ttlMs === null) {
            ttlMs = this._defaultTtlMs;
        }
        try {
            this._storage.setItem(this._key(key), JSON.stringify({
                _validUntil: ttlMs ? new Date(Date.now() + ttlMs) : 0,
                payload: val,
            }));
        }
        catch (e) {
            console.error(e);
            this.log("!setItem(" + key + ") " + e);
            if (/quota/i.test(e)) {
                this.removeExpired();
            } // too naive?
        }
        return this;
    };
    /**
     * @param key
     * @param fallbackValue
     * @returns {any}
     */
    MMStorage.prototype.getItem = function (key, fallbackValue) {
        if (fallbackValue === void 0) { fallbackValue = null; }
        key = this._key(key);
        var val = this._storage.getItem(key);
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
        }
        catch (e) {
            // corrupted json?
            console.error(e);
            this.log("!getItem(" + key + ") " + e);
        }
        return null;
    };
    /**
     * @param key
     * @returns {MMStorage}
     */
    MMStorage.prototype.removeItem = function (key) {
        this._storage.removeItem(this._key(key));
        return this;
    };
    /**
     * @returns {MMStorage}
     */
    MMStorage.prototype.removeAll = function () {
        this._storage.clear();
        return this;
    };
    /**
     *
     */
    MMStorage.prototype.removeExpired = function () {
        this.log("removeExpired()");
        for (var i = 0, len = this._storage.length; i < len; ++i) {
            var key = this._storage.key(i);
            this.getItem(key); // this cleans up
        }
    };
    /**
     * @param rgxStr
     * @param prefix
     * @returns {number}
     */
    MMStorage.prototype.removeMatching = function (rgxStr, prefix) {
        if (prefix === void 0) { prefix = null; }
        if (prefix === null) {
            prefix = this._prefix;
        }
        var rx = new RegExp(
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
        '^' + (prefix + rgxStr).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        // console.log(rx);
        var counter = 0;
        for (var i = 0; i < this._storage.length; ++i) {
            var key = this._storage.key(i);
            if (rx.test(key)) {
                this._storage.removeItem(key);
                counter++;
                i--; // because removeItem has just shortened the length
            }
        }
        return counter;
    };
    /**
     * @param key
     * @returns {string}
     * @private
     */
    MMStorage.prototype._key = function (key) {
        return this._prefix + key;
    };
    return MMStorage;
}());
exports.MMStorage = MMStorage;
