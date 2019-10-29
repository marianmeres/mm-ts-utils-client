declare const window: any;
declare const opr: any;
declare const InstallTrigger: any;
declare const safari: any;
declare const document: any;

/**
 * naive, but gets the job done...
 * https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/9851769
 */
export const mmDetectBrowser = (() => {
    let _detected;
    return () => {
        // prettier-ignore
        if (!_detected) {
            // Opera 8.0+
            const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Firefox 1.0+
            const isFirefox = typeof InstallTrigger !== 'undefined';
            // Safari 3.0+ "[object HTMLElementConstructor]"
            const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
            // Internet Explorer 6-11
            const isIE = /*@cc_on!@*/false || !!document.documentMode;
            // Edge 20+
            const isEdge = !isIE && !!window.StyleMedia;
            // Chrome 1 - 71
            const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
            // Blink engine detection
            const isBlink = (isChrome || isOpera) && !!window.CSS;

            //
            _detected = {
                isOpera, isFirefox, isSafari, isIE, isEdge, isChrome, isBlink
            }
        }
        return _detected;
    }
})();