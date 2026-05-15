"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecordEqual = isRecordEqual;
/**
 * Compare two records with primitive values as the content.
 */
function isRecordEqual(a, b) {
    if (a === b) {
        return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    return aKeys.every((key) => Object.is(a[key], b[key]));
}
//# sourceMappingURL=isRecordEqual.js.map