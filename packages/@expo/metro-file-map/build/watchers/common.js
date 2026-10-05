"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Originally vendored from
 * https://github.com/amasad/sane/blob/64ff3a870c42e84f744086884bf55a4f9c22d376/src/common.js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.posixPathMatchesPattern = exports.ALL_EVENT = exports.RECRAWL_EVENT = exports.TOUCH_EVENT = exports.DELETE_EVENT = void 0;
exports.isIncluded = isIncluded;
exports.typeFromStat = typeFromStat;
const path_1 = __importDefault(require("path"));
exports.DELETE_EVENT = 'delete';
exports.TOUCH_EVENT = 'touch';
exports.RECRAWL_EVENT = 'recrawl';
exports.ALL_EVENT = 'all';
/**
 * Whether a watcher should report a change at the given relative path. Only
 * regular files are checked against `included`, and every file is included
 * when it is null.
 *
 * A file matches an extension when its basename ends with `.` followed by
 * that extension, so `.env` matches `env` and `foo.d.ts` matches `d.ts`.
 */
function isIncluded(type, included, relativePath) {
    if (included == null || type !== 'f') {
        return true;
    }
    const basename = path_1.default.basename(relativePath);
    return (hasIncludedExtension(included.extensions, basename) ||
        included.basenames.has(basename) ||
        included.basenamePrefixes.some((prefix) => basename.startsWith(prefix)));
}
function hasIncludedExtension(extensions, basename) {
    for (let i = basename.indexOf('.'); i !== -1; i = basename.indexOf('.', i + 1)) {
        if (extensions.has(basename.slice(i + 1))) {
            return true;
        }
    }
    return false;
}
/**
 * Whether the given filePath matches the given RegExp, after converting
 * (on Windows only) system separators to posix separators.
 *
 * Conversion to posix is for backwards compatibility with the previous
 * anymatch matcher, which normlises all inputs[1]. This may not be consistent
 * with other parts of metro-file-map.
 *
 * [1]: https://github.com/micromatch/anymatch/blob/3.1.1/index.js#L50
 */
exports.posixPathMatchesPattern = path_1.default.sep === '/'
    ? (pattern, filePath) => pattern.test(filePath)
    : (pattern, filePath) => pattern.test(filePath.replaceAll(path_1.default.sep, '/'));
function typeFromStat(stat) {
    // Note: These tests are not mutually exclusive - a symlink passes isFile
    if (stat.isSymbolicLink()) {
        return 'l';
    }
    if (stat.isDirectory()) {
        return 'd';
    }
    if (stat.isFile()) {
        return 'f'; // "Regular" file
    }
    return null;
}
