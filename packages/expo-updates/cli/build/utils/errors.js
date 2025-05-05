"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandError = void 0;
exports.logCmdError = logCmdError;
const assert_1 = require("assert");
const chalk_1 = __importDefault(require("chalk"));
const log_1 = require("./log");
const ERROR_PREFIX = 'Error: ';
/**
 * General error, formatted as a message in red text when caught by expo-cli (no stack trace is printed). Should be used in favor of `log.error()` in most cases.
 */
class CommandError extends Error {
    code;
    name = 'CommandError';
    isCommandError = true;
    constructor(code, message = '') {
        super('');
        this.code = code;
        // If e.toString() was called to get `message` we don't want it to look
        // like "Error: Error:".
        if (message.startsWith(ERROR_PREFIX)) {
            message = message.substring(ERROR_PREFIX.length);
        }
        this.message = message || code;
    }
}
exports.CommandError = CommandError;
function logCmdError(error) {
    if (!(error instanceof Error)) {
        throw error;
    }
    if (error instanceof CommandError || error instanceof assert_1.AssertionError) {
        // Print the stack trace in debug mode only.
        (0, log_1.exit)(error);
    }
    const errorDetails = error.stack ? '\n' + chalk_1.default.gray(error.stack) : '';
    (0, log_1.exit)(chalk_1.default.red(error.toString()) + errorDetails);
}
