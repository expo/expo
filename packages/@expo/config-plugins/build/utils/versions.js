"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gteSdkVersion = gteSdkVersion;
exports.lteSdkVersion = lteSdkVersion;
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function gteSdkVersion(exp, sdkVersion) {
  if (!exp.sdkVersion) {
    return false;
  }
  if (exp.sdkVersion === 'UNVERSIONED') {
    return true;
  }
  try {
    return _semver().default.gte(exp.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}
function lteSdkVersion(exp, sdkVersion) {
  if (!exp.sdkVersion) {
    return false;
  }
  if (exp.sdkVersion === 'UNVERSIONED') {
    return false;
  }
  try {
    return _semver().default.lte(exp.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}
//# sourceMappingURL=versions.js.map