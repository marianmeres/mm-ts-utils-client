"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * naive, but gets the job done...
 * https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/9851769
 */
exports.mmDetectBrowser = (function () {
    var _detected;
    return function () {
        // prettier-ignore
        if (!_detected) {
            // Opera 8.0+
            var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Firefox 1.0+
            var isFirefox = typeof InstallTrigger !== 'undefined';
            // Safari 3.0+ "[object HTMLElementConstructor]"
            var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
            // Internet Explorer 6-11
            var isIE = /*@cc_on!@*/ false || !!document.documentMode;
            // Edge 20+
            var isEdge = !isIE && !!window.StyleMedia;
            // Chrome 1 - 71
            var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
            // Blink engine detection
            var isBlink = (isChrome || isOpera) && !!window.CSS;
            //
            _detected = {
                isOpera: isOpera, isFirefox: isFirefox, isSafari: isSafari, isIE: isIE, isEdge: isEdge, isChrome: isChrome, isBlink: isBlink
            };
        }
        return _detected;
    };
})();
