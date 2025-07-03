"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.debug = debug;
exports.info = info;
exports.warn = warn;
exports.setEnableLogging = setEnableLogging;
let enableLogging = false;
function log(...params) {
    if (enableLogging) {
        console.log(...params);
    }
}
function debug(...params) {
    if (enableLogging) {
        console.debug(...params);
    }
}
function info(...params) {
    if (enableLogging) {
        console.info(...params);
    }
}
function warn(...params) {
    if (enableLogging) {
        console.warn(...params);
    }
}
function setEnableLogging(enabled) {
    enableLogging = enabled;
}
//# sourceMappingURL=logger.js.map