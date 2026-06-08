"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/utils/path.ts#L1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extname = exports.joinPath = exports.fileURLToFilePath = exports.filePathToFileURL = exports.decodeFilePathFromAbsolute = exports.encodeFilePathToAbsolute = void 0;
// Terminology:
// - filePath: posix-like file path, e.g. `/foo/bar.js` or `c:/foo/bar.js`
//   This is used by Vite.
// - fileURL: file URL, e.g. `file:///foo/bar.js` or `file:///c:/foo/bar.js`
//   This is used by import().
// - osPath: os dependent path, e.g. `/foo/bar.js` or `c:\foo\bar.js`
//   This is used by node:fs.
const ABSOLUTE_WIN32_PATH_REGEXP = /^\/[a-zA-Z]:\//;
const encodeFilePathToAbsolute = (filePath) => {
    if (ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)) {
        throw new Error('Unsupported absolute file path');
    }
    if (filePath.startsWith('/')) {
        return filePath;
    }
    return '/' + filePath;
};
exports.encodeFilePathToAbsolute = encodeFilePathToAbsolute;
const decodeFilePathFromAbsolute = (filePath) => {
    if (ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)) {
        return filePath.slice(1);
    }
    return filePath;
};
exports.decodeFilePathFromAbsolute = decodeFilePathFromAbsolute;
const filePathToFileURL = (filePath) => 'file://' + encodeURI(filePath);
exports.filePathToFileURL = filePathToFileURL;
/** Return the original "osPath" based on the file URL */
const fileURLToFilePath = (fileURL) => {
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    const filePath = decodeURI(fileURL.slice('file://'.length));
    // File URLs are always formatted in POSIX, using a leading `/` (URL pathname) separator.
    // On POSIX systems, this leading `/` is the root directory, which is valid for absolute file paths.
    // On UNIX systems, this leading `/` needs to be stripped, and the actual UNIX formatted path is returned - to match Metro's behavior
    return ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)
        ? filePath.slice(1).replace(/\//g, '\\')
        : filePath;
};
exports.fileURLToFilePath = fileURLToFilePath;
// for filePath
const joinPath = (...paths) => {
    const isAbsolute = paths[0]?.startsWith('/');
    const items = [].concat(...paths.map((path) => path.split('/')));
    let i = 0;
    while (i < items.length) {
        if (items[i] === '.' || items[i] === '') {
            items.splice(i, 1);
        }
        else if (items[i] === '..') {
            if (i > 0) {
                items.splice(i - 1, 2);
                --i;
            }
            else {
                items.splice(i, 1);
            }
        }
        else {
            ++i;
        }
    }
    return (isAbsolute ? '/' : '') + items.join('/') || '.';
};
exports.joinPath = joinPath;
const extname = (filePath) => {
    const index = filePath.lastIndexOf('.');
    return index > 0 ? filePath.slice(index) : '';
};
exports.extname = extname;
//# sourceMappingURL=path.js.map