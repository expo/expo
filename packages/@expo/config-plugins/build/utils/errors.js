"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UnexpectedError = exports.PluginError = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class UnexpectedError extends Error {
  constructor(message) {
    super(`${message}\nPlease report this as an issue on https://github.com/expo/expo-cli/issues`);

    _defineProperty(this, "name", 'UnexpectedError');
  }

}

exports.UnexpectedError = UnexpectedError;

/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class PluginError extends Error {
  constructor(message, code, cause) {
    super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
    this.code = code;
    this.cause = cause;

    _defineProperty(this, "name", 'PluginError');

    _defineProperty(this, "isPluginError", true);
  }

}

exports.PluginError = PluginError;
//# sourceMappingURL=errors.js.map