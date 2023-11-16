"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWarningForPlatform = exports.addWarningIOS = exports.addWarningAndroid = void 0;
const chalk_1 = __importDefault(require("chalk"));
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
exports.addWarningAndroid = addWarningAndroid;
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
exports.addWarningIOS = addWarningIOS;
function addWarningForPlatform(platform, property, text, link) {
    console.warn(formatWarning(platform, property, text, link));
}
exports.addWarningForPlatform = addWarningForPlatform;
function formatWarning(platform, property, warning, link) {
    return chalk_1.default.yellow `${'» ' + chalk_1.default.bold(platform)}: ${property}: ${warning}${link ? chalk_1.default.gray(' ' + link) : ''}`;
}
