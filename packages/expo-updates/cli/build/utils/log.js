"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exit = exports.log = exports.warn = exports.error = exports.timeEnd = exports.time = void 0;
function time(label) {
    console.time(label);
}
exports.time = time;
function timeEnd(label) {
    console.timeEnd(label);
}
exports.timeEnd = timeEnd;
function error(...message) {
    console.error(...message);
}
exports.error = error;
function warn(...message) {
    console.warn(...message);
}
exports.warn = warn;
function log(...message) {
    console.log(...message);
}
exports.log = log;
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
function exit(message, code = 1) {
    if (code === 0) {
        log(message);
    }
    else {
        error(message);
    }
    process.exit(code);
}
exports.exit = exit;
