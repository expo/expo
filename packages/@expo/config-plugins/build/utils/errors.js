"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginError = exports.UnexpectedError = void 0;
class UnexpectedError extends Error {
    name = 'UnexpectedError';
    constructor(message) {
        super(`${message}\nPlease report this as an issue on https://github.com/expo/expo-cli/issues`);
    }
}
exports.UnexpectedError = UnexpectedError;
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class PluginError extends Error {
    code;
    cause;
    name = 'PluginError';
    isPluginError = true;
    constructor(message, code, cause) {
        super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
        this.code = code;
        this.cause = cause;
    }
}
exports.PluginError = PluginError;
