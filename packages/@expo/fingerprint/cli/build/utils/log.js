"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.time = time;
exports.timeEnd = timeEnd;
exports.error = error;
exports.exception = exception;
exports.warn = warn;
exports.log = log;
exports.clear = clear;
exports.exit = exit;
const chalk_1 = __importDefault(require("chalk"));
function time(label) {
    console.time(label);
}
function timeEnd(label) {
    console.timeEnd(label);
}
function error(...message) {
    console.error(...message);
}
/** Print an error and provide additional info (the stack trace) in debug mode. */
function exception(e) {
    error(chalk_1.default.red(e.toString()) + (process.env.EXPO_DEBUG ? '\n' + chalk_1.default.gray(e.stack) : ''));
}
function warn(...message) {
    console.warn(...message.map((value) => chalk_1.default.yellow(value)));
}
function log(...message) {
    console.log(...message);
}
/** Clear the terminal of all text. */
function clear() {
    process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}
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
