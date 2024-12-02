"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPosixPath = void 0;
const REGEXP_REPLACE_SLASHES = /\\/g;
/**
 * Convert any platform-specific path to a POSIX path.
 */
function toPosixPath(filePath) {
    return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
exports.toPosixPath = toPosixPath;
//# sourceMappingURL=filePath.js.map