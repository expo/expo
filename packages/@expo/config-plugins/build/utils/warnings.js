"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addWarningAndroid = addWarningAndroid;
exports.addWarningForPlatform = addWarningForPlatform;
exports.addWarningIOS = addWarningIOS;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » android: android.package: property is invalid https://expo.fyi/android-package
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
function addWarningAndroid(property, text, link) {
  console.warn(formatWarning('android', property, text, link));
}

/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » ios: ios.bundleIdentifier: property is invalid https://expo.fyi/bundle-identifier
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
function addWarningIOS(property, text, link) {
  console.warn(formatWarning('ios', property, text, link));
}
function addWarningForPlatform(platform, property, text, link) {
  console.warn(formatWarning(platform, property, text, link));
}
function formatWarning(platform, property, warning, link) {
  return _chalk().default.yellow`${'» ' + _chalk().default.bold(platform)}: ${property}: ${warning}${link ? _chalk().default.gray(' ' + link) : ''}`;
}
//# sourceMappingURL=warnings.js.map