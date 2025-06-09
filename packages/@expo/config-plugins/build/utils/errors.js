"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UnexpectedError = exports.PluginError = void 0;
class UnexpectedError extends Error {
  name = 'UnexpectedError';
  constructor(message) {
    super(`${message}\nReport this issue: https://github.com/expo/expo/issues`);
  }
}
exports.UnexpectedError = UnexpectedError;
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class PluginError extends Error {
  name = 'PluginError';
  isPluginError = true;
  constructor(message, code, cause) {
    super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
    this.code = code;
    this.cause = cause;
  }
}
exports.PluginError = PluginError;
//# sourceMappingURL=errors.js.map