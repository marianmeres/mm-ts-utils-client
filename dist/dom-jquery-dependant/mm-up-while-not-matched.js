"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _isFunction = function (obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};
/**
 * Utilitka skusajuca matcher nad $el... ak matcher vrati false tak bude skusat
 * stastie **vyssie** u parenta az kym nenajde, alebo nehitne traverseLimit
 *
 * Note: v principe podobna ako $.closest() akurat v rozsirenou funcionalitov
 * matchovania a doplnenym traverse limitom
 *
 * @param {any} $el
 * @param matcher
 * @param {number} traverseLimit
 * @returns {any}
 */
function mmUpWhileNotMatched($el, matcher, traverseLimit) {
    if (traverseLimit === void 0) { traverseLimit = 5; }
    if (!_isFunction(matcher)) {
        return false;
    } // no-op
    var matched = matcher($el);
    var counter = 0;
    // dolezite: traverseLimit chceme urcite dat **nejake** pozitivne cele cislo,
    // lebo inak tu mame riziko endless loop...
    // 1. set default ak nie je digit (toto odchyti undefined ako aj ine hodnoty a typy)
    //    note: tu sa nespolieham na typescript
    if (!/^\d+$/.test("" + traverseLimit)) {
        // interne precastuje na string
        traverseLimit = 5;
    }
    // 2. explicit cast na int (aby nizsie porovnanie zbehlo korektne)
    //    Note: NaN tu nemusime testovat, lebo vyssi regex uz validoval...
    traverseLimit = parseInt("" + traverseLimit, 10);
    // explicit false check, not just falsey... keby sme sa pytali iba na falsey
    // tak by neslo rozlisit medzi regulernou falsey a not found
    while (matched === false) {
        $el = $el.parent();
        if (!$el || (traverseLimit && ++counter === traverseLimit)) {
            break;
        }
        matched = matcher($el);
    }
    return matched;
}
exports.mmUpWhileNotMatched = mmUpWhileNotMatched;
