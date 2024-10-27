"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSource = exports.sortSources = void 0;
function sortSources(sources) {
    return sources.sort(compareSource);
}
exports.sortSources = sortSources;
const typeOrder = {
    file: 0,
    dir: 1,
    contents: 2,
};
/**
 * Comparator between two sources.
 * This is useful for sorting sources in a consistent order.
 * @returns:
 *  == 0 if a and b are equal,
 *  < 0 if a is less than b,
 *  > 0 if a is greater than b.
 */
function compareSource(a, b) {
    const typeResult = typeOrder[a.type] - typeOrder[b.type];
    if (typeResult === 0) {
        if (a.type === 'file' && b.type === 'file') {
            return a.filePath.localeCompare(b.filePath);
        }
        else if (a.type === 'dir' && b.type === 'dir') {
            return a.filePath.localeCompare(b.filePath);
        }
        else if (a.type === 'contents' && b.type === 'contents') {
            return a.id.localeCompare(b.id);
        }
    }
    return typeResult;
}
exports.compareSource = compareSource;
//# sourceMappingURL=Sort.js.map