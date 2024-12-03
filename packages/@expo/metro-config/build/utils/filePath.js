"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPosixPath = void 0;
const node_process_1 = require("node:process");
const REGEXP_REPLACE_SLASHES = /\\/g;
/**
 * Convert any platform-specific path to a POSIX path.
 */
function toPosixPath(filePath) {
    return node_process_1.platform === 'win32' ? filePath.replace(REGEXP_REPLACE_SLASHES, '/') : filePath;
}
exports.toPosixPath = toPosixPath;
//# sourceMappingURL=filePath.js.map