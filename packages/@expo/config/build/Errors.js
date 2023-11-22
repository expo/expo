"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfigError = void 0;
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
class ConfigError extends Error {
  name = 'ConfigError';
  isConfigError = true;
  constructor(message, code, cause) {
    super(cause ? `${message}\n└─ Cause: ${cause.name}: ${cause.message}` : message);
    this.code = code;
    this.cause = cause;
  }
}
exports.ConfigError = ConfigError;
//# sourceMappingURL=Errors.js.map