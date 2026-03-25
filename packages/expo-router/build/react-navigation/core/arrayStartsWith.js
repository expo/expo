"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayStartsWith = arrayStartsWith;
/**
 * Compare two arrays to check if the first array starts with the second array.
 */
function arrayStartsWith(array, start) {
    if (start.length > array.length) {
        return false;
    }
    return start.every((it, index) => it === array[index]);
}
//# sourceMappingURL=arrayStartsWith.js.map