"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * https://gist.github.com/jlong/2428561
 * @param url
 * @param key
 * @returns {{protocol: string, hostname: string, port: string, pathname: string, search: string, hash: string}}
 */
function mmParseUrl(url, key) {
    var out = {
        protocol: '',
        hostname: '',
        port: '',
        pathname: '',
        search: '',
        hash: '',
    };
    var parser = document.createElement('a');
    parser.href = url || window.location.href;
    Object.keys(out).forEach(function (k) { return (out[k] = parser[k] || ''); });
    return key ? out[key] : out;
}
exports.mmParseUrl = mmParseUrl;
