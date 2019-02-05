/**
 * https://gist.github.com/jlong/2428561
 * @param url
 * @param key
 * @returns {{protocol: string, hostname: string, port: string, pathname: string, search: string, hash: string}}
 */
export function mmParseUrl(url?: string, key?) {
    let out = {
        protocol: '', // => "http:"
        hostname: '', // => "example.com"
        port: '', // => "3000"
        pathname: '', // => "/pathname/"
        search: '', // => "?search=test"
        hash: '', // => "#hash"
    };
    let parser = document.createElement('a');
    parser.href = url || window.location.href;

    Object.keys(out).forEach((k) => (out[k] = parser[k] || ''));

    return key ? out[key] : out;
}
