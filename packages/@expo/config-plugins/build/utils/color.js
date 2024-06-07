"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertColor = convertColor;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// @ts-expect-error: normalize-colors does not export types

let normalizeColor = null;

/**
 * Convert a color string to an integer.
 * @param projectRoot The project root directory.
 * @param color The color string to convert, e.g. '#ff0000', 'red', 'rgba(255, 0, 0, 1)'.
 */
function convertColor(projectRoot, color) {
  if (!normalizeColor) {
    const normalizeColorPath = resolveNormalizeColor(projectRoot);
    if (!normalizeColorPath) {
      throw new Error('Unable to resolve the @react-native/normalize-colors package');
    }
    normalizeColor = require(normalizeColorPath);
  }
  const colorInt = normalizeColor(color);
  if (!colorInt) {
    throw new Error(`Invalid color value: ${color}`);
  }
  return (colorInt << 24 | colorInt >>> 8) >>> 0;
}
function resolveNormalizeColor(projectRoot) {
  const reactNativePackageJsonPath = _resolveFrom().default.silent(projectRoot, 'react-native/package.json');
  if (reactNativePackageJsonPath) {
    const reactNativeDir = _path().default.dirname(reactNativePackageJsonPath);
    const normalizeColorPath = _resolveFrom().default.silent(reactNativeDir, '@react-native/normalize-colors');
    if (normalizeColorPath) {
      return normalizeColorPath;
    }
  }
  return null;
}
//# sourceMappingURL=color.js.map