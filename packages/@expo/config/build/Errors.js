"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfigError = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class ConfigError extends Error {
  constructor(message, code, cause) {
    super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
    this.code = code;
    this.cause = cause;

    _defineProperty(this, "name", 'ConfigError');

    _defineProperty(this, "isConfigError", true);
  }

}

exports.ConfigError = ConfigError;
//# sourceMappingURL=Errors.js.map