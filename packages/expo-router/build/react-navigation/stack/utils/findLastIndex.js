"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLastIndex = findLastIndex;
function findLastIndex(array, callback) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (callback(array[i])) {
            return i;
        }
    }
    return -1;
}
//# sourceMappingURL=findLastIndex.js.map