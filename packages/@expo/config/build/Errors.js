"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = void 0;
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class ConfigError extends Error {
    constructor(message, code, cause) {
        super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
        this.code = code;
        this.cause = cause;
        this.name = 'ConfigError';
        this.isConfigError = true;
    }
}
exports.ConfigError = ConfigError;
