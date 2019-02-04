
/**
 * ported z https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js
 *
 * @param $context
 */
export function mmGetFocusableEls($context: any) {
    let focusableElements = [
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

    return $(focusableElements.join(','), $context).filter((index, el) => {
        let child = $(el).get(0);
        return !!(
            child.offsetWidth ||
            child.offsetHeight ||
            child.getClientRects().length
        );
    });
}