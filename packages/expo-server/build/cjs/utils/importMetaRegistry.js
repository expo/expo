"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMetaRegistry = void 0;
const DEFAULT_SCRIPT_NAME = 'file:///__main.js';
const REGEXP_REPLACE_SLASHES = /\\/g;
const WIN32_PATH_REGEXP = /^[a-zA-Z]:[/\\]/;
// - ./runtime/importMetaRegistry.ts (this file) -> importMetaRegistry.url
// - ./runtime/index.ts -> globalThis.__ExpoImportMetaRegistry
// - <source>
const CALL_DEPTH = 3;
function getFileName(offset = 0) {
    const originalStackFormatter = Error.prepareStackTrace;
    const originalStackTraceLimit = Error.stackTraceLimit;
    try {
        Error.stackTraceLimit = offset;
        Error.prepareStackTrace = (_err, stack) => stack[offset - 1]?.getFileName();
        return new Error().stack;
    }
    finally {
        Error.prepareStackTrace = originalStackFormatter;
        Error.stackTraceLimit = originalStackTraceLimit;
    }
}
/**
 * Convert any platform-specific path to a POSIX path.
 */
function toPosixPath(filePath) {
    return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
exports.importMetaRegistry = {
    get url() {
        let scriptName = getFileName(CALL_DEPTH);
        if (scriptName) {
            if (scriptName[0] === '/') {
                scriptName = `file://${scriptName}`;
            }
            else if (WIN32_PATH_REGEXP.test(scriptName)) {
                scriptName = `file:///${scriptName}`;
            }
        }
        return toPosixPath(scriptName || DEFAULT_SCRIPT_NAME);
    },
};
//# sourceMappingURL=importMetaRegistry.js.map