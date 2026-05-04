"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.error = error;
exports.exception = exception;
exports.exit = exit;
/**
 * These functions are copied from packages/@expo/cli/src/log.ts
 */
const chalk_1 = __importDefault(require("chalk"));
function log(...message) {
    console.log(...message);
}
function error(...message) {
    console.error(...message);
}
/** Print an error and provide additional info (the stack trace) in debug mode. */
function exception(e) {
    const { env } = require('./utils/env');
    error(chalk_1.default.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk_1.default.gray(e.stack) : ''));
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
//# sourceMappingURL=log.js.map