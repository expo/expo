"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isLegacyImportsEnabled = isLegacyImportsEnabled;

function _getenv() {
  const data = require("getenv");

  _getenv = function () {
    return data;
  };

  return data;
}

function _semver() {
  const data = _interopRequireDefault(require("semver"));

  _semver = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Should the bundler use .expo file extensions.
 *
 * @param exp
 */
function isLegacyImportsEnabled(exp) {
  if ((0, _getenv().boolish)('EXPO_LEGACY_IMPORTS', false)) {
    console.warn('Dangerously enabled the deprecated `.expo` extensions feature, this functionality may be removed between SDK cycles.');
    return true;
  } // Only allow target if the SDK version is available and it's less 41.
  // This is optimized for making future projects work.


  return lteSdkVersion(exp, '40.0.0');
}

function lteSdkVersion(expJson, sdkVersion) {
  if (!expJson.sdkVersion) {
    return false;
  }

  if (expJson.sdkVersion === 'UNVERSIONED') {
    return false;
  }

  try {
    return _semver().default.lte(expJson.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${expJson.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}
//# sourceMappingURL=isLegacyImportsEnabled.js.map