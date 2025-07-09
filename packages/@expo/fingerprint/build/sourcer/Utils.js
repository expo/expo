"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileBasedHashSourceAsync = getFileBasedHashSourceAsync;
exports.stringifyJsonSorted = stringifyJsonSorted;
exports.relativizeJsonPaths = relativizeJsonPaths;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Path_1 = require("../utils/Path");
async function getFileBasedHashSourceAsync(projectRoot, filePath, reason) {
    let result = null;
    try {
        const stat = await promises_1.default.stat(path_1.default.join(projectRoot, filePath));
        result = {
            type: stat.isDirectory() ? 'dir' : 'file',
            filePath: (0, Path_1.toPosixPath)(filePath),
            reasons: [reason],
        };
    }
    catch {
        result = null;
    }
    return result;
}
/**
 * A version of `JSON.stringify` that keeps the keys sorted
 */
function stringifyJsonSorted(target, space) {
    return JSON.stringify(target, (_, value) => sortJson(value), space);
}
/**
 * Transform absolute paths in JSON to relative paths based on the project root.
 */
function relativizeJsonPaths(value, projectRoot) {
    if (typeof value === 'string' && value.startsWith(projectRoot)) {
        return (0, Path_1.toPosixPath)(path_1.default.relative(projectRoot, value));
    }
    if (Array.isArray(value)) {
        return value.map((item) => relativizeJsonPaths(item, projectRoot));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, relativizeJsonPaths(val, projectRoot)]));
    }
    return value;
}
function sortJson(json) {
    if (Array.isArray(json)) {
        return json.sort((a, b) => {
            // Sort array items by their stringified value.
            // We don't need the array to be sorted in meaningful way, just to be sorted in deterministic.
            // E.g. `[{ b: '2' }, {}, { a: '3' }, null]` -> `[null, { a : '3' }, { b: '2' }, {}]`
            // This result is not a perfect solution, but it's good enough for our use case.
            const stringifiedA = stringifyJsonSorted(a);
            const stringifiedB = stringifyJsonSorted(b);
            if (stringifiedA < stringifiedB) {
                return -1;
            }
            else if (stringifiedA > stringifiedB) {
                return 1;
            }
            return 0;
        });
    }
    if (json != null && typeof json === 'object') {
        // Sort object items by keys
        return Object.keys(json)
            .sort()
            .reduce((acc, key) => {
            acc[key] = json[key];
            return acc;
        }, {});
    }
    // Return primitives
    return json;
}
//# sourceMappingURL=Utils.js.map