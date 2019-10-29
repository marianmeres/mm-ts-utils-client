"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * https://techoverflow.net/2018/03/30/copying-strings-to-the-clipboard-using-pure-javascript/
 */
exports.mmCopyStringToClipboard = function (str) {
    if (!document.queryCommandSupported || !document.queryCommandSupported('copy')) {
        return false;
    }
    var $el = document.createElement('textarea');
    $el.value = str;
    // Set non-editable to avoid focus and move outside of view
    $el.setAttribute('readonly', '');
    $el.style.position = 'absolute';
    $el.style.left = '-99999px';
    document.body.appendChild($el);
    $el.select();
    document.execCommand('copy');
    document.body.removeChild($el);
    return true;
};
