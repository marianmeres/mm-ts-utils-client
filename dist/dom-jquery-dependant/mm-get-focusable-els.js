"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ported z https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js
 *
 * @param $context
 */
function mmGetFocusableEls($context) {
    var focusableElements = [
        'a[href]',
        'area[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex^="-"])',
    ];
    return $(focusableElements.join(','), $context).filter(function (index, el) {
        var child = $(el).get(0);
        return !!(child.offsetWidth ||
            child.offsetHeight ||
            child.getClientRects().length);
    });
}
exports.mmGetFocusableEls = mmGetFocusableEls;
