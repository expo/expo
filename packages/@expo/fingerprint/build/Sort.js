"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortSources = sortSources;
exports.sortConfig = sortConfig;
exports.compareSource = compareSource;
function sortSources(sources) {
    return sources.sort(compareSource);
}
/**
 * Recursively sorts a JSON object or array for stable hashing.
 *
 * Heuristics:
 * - Object keys are sorted alphabetically (values can be mixed types)
 * - Arrays of primitives are sorted naturally (handles mixed primitive types)
 * - Arrays of objects are sorted by common keys (name, id, key, type) if all objects have them
 * - Mixed-type arrays (e.g., [1, {}, "a"]) maintain original order after recursive sorting
 *
 * Note: Assumes arrays are homogeneous for optimal sorting. Mixed-type arrays will not be reordered,
 * which may not produce stable hashes if input order varies.
 */
function sortConfig(data) {
    if (data == null) {
        return data;
    }
    if (typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return sortArray(data);
    }
    return sortObject(data);
}
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
            const aValue = a.overrideHashKey ?? a.filePath;
            const bValue = b.overrideHashKey ?? b.filePath;
            return aValue.localeCompare(bValue);
        }
        else if (a.type === 'dir' && b.type === 'dir') {
            const aValue = a.overrideHashKey ?? a.filePath;
            const bValue = b.overrideHashKey ?? b.filePath;
            return aValue.localeCompare(bValue);
        }
        else if (a.type === 'contents' && b.type === 'contents') {
            return a.id.localeCompare(b.id);
        }
    }
    return typeResult;
}
//#region Internals
function sortArray(arr) {
    if (arr.length === 0) {
        return arr;
    }
    const allPrimitives = arr.every((item) => typeof item !== 'object' || item == null);
    if (allPrimitives) {
        return arr.slice().sort((a, b) => {
            if (a === null)
                return -1;
            if (b === null)
                return 1;
            if (typeof a === 'string' && typeof b === 'string') {
                return a.localeCompare(b);
            }
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            if (typeof a === 'boolean' && typeof b === 'boolean') {
                return a === b ? 0 : a ? 1 : -1;
            }
            return String(a).localeCompare(String(b));
        });
    }
    const sortedElements = arr.map((item) => sortConfig(item));
    const allObjects = sortedElements.every((item) => typeof item === 'object' && item != null && !Array.isArray(item));
    if (allObjects) {
        const sortKey = findBestSortKey(sortedElements);
        if (sortKey) {
            return sortedElements.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return aVal.localeCompare(bVal);
                }
                return String(aVal).localeCompare(String(bVal));
            });
        }
    }
    return sortedElements;
}
function sortObject(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    for (const key of sortedKeys) {
        result[key] = sortConfig(obj[key]);
    }
    return result;
}
function findBestSortKey(objects) {
    if (objects.length === 0) {
        return null;
    }
    const priorityKeys = ['name', 'id', 'key', 'type'];
    for (const key of priorityKeys) {
        if (objects.every((obj) => obj.hasOwnProperty(key) && (typeof obj[key] === 'string' || typeof obj[key] === 'number'))) {
            return key;
        }
    }
    return null;
}
//#endregion Internals
//# sourceMappingURL=Sort.js.map