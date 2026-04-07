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
exports.includedByGlob = includedByGlob;
exports.typeFromStat = typeFromStat;
const micromatch_1 = __importDefault(require("micromatch"));
const path_1 = __importDefault(require("path"));
exports.DELETE_EVENT = 'delete';
exports.TOUCH_EVENT = 'touch';
exports.RECRAWL_EVENT = 'recrawl';
exports.ALL_EVENT = 'all';
/**
 * Checks a file relative path against the globs array.
 */
function includedByGlob(type, globs, dot, relativePath) {
    // For non-regular files or if there are no glob matchers, just respect the
    // `dot` option to filter dotfiles if dot === false.
    if (globs.length === 0 || type !== 'f') {
        return dot || micromatch_1.default.some(relativePath, '**/*');
    }
    return micromatch_1.default.some(relativePath, globs, { dot });
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
