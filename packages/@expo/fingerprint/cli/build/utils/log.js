"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exit = exports.clear = exports.log = exports.warn = exports.exception = exports.error = exports.timeEnd = exports.time = void 0;
const chalk_1 = __importDefault(require("chalk"));
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
/** Print an error and provide additional info (the stack trace) in debug mode. */
function exception(e) {
    error(chalk_1.default.red(e.toString()) + (process.env.EXPO_DEBUG ? '\n' + chalk_1.default.gray(e.stack) : ''));
}
exports.exception = exception;
function warn(...message) {
    console.warn(...message.map((value) => chalk_1.default.yellow(value)));
}
exports.warn = warn;
function log(...message) {
    console.log(...message);
}
exports.log = log;
/** Clear the terminal of all text. */
function clear() {
    process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}
exports.clear = clear;
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
function exit(message, code = 1) {
    if (message instanceof Error) {
        exception(message);
        process.exit(code);
    }
    if (message) {
        if (code === 0) {
            log(message);
        }
        else {
            error(message);
        }
    }
    process.exit(code);
}
exports.exit = exit;
