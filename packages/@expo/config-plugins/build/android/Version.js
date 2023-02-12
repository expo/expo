"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVersionCode = getVersionCode;
exports.getVersionName = getVersionName;
exports.setMinBuildScriptExtVersion = setMinBuildScriptExtVersion;
exports.setVersionCode = setVersionCode;
exports.setVersionName = setVersionName;
exports.withVersion = exports.withBuildScriptExtMinimumVersion = void 0;
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
const withVersion = config => {
  return (0, _androidPlugins().withAppBuildGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setVersionCode(config, config.modResults.contents);
      config.modResults.contents = setVersionName(config, config.modResults.contents);
    } else {
      (0, _warnings().addWarningAndroid)('android.versionCode', `Cannot automatically configure app build.gradle if it's not groovy`);
    }
    return config;
  });
};

/** Sets a numeric version for a value in the project.gradle buildscript.ext object to be at least the provided props.minVersion, if the existing value is greater then no change will be made. */
exports.withVersion = withVersion;
const withBuildScriptExtMinimumVersion = (config, props) => {
  return (0, _androidPlugins().withProjectBuildGradle)(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setMinBuildScriptExtVersion(config.modResults.contents, props);
    } else {
      (0, _warnings().addWarningAndroid)('withBuildScriptExtVersion', `Cannot automatically configure project build.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withBuildScriptExtMinimumVersion = withBuildScriptExtMinimumVersion;
function setMinBuildScriptExtVersion(buildGradle, {
  name,
  minVersion
}) {
  var _buildGradle$match;
  const regex = new RegExp(`(${name}\\s?=\\s?)(\\d+(?:\\.\\d+)?)`);
  const currentVersion = (_buildGradle$match = buildGradle.match(regex)) === null || _buildGradle$match === void 0 ? void 0 : _buildGradle$match[2];
  if (!currentVersion) {
    (0, _warnings().addWarningAndroid)('withBuildScriptExtVersion', `Cannot set minimum buildscript.ext.${name} version because the property "${name}" cannot be found or does not have a numeric value.`);
    // TODO: Maybe just add the property...
    return buildGradle;
  }
  const currentVersionNum = Number(currentVersion);
  return buildGradle.replace(regex, `$1${Math.max(minVersion, currentVersionNum)}`);
}
function getVersionName(config) {
  var _config$version;
  return (_config$version = config.version) !== null && _config$version !== void 0 ? _config$version : null;
}
function setVersionName(config, buildGradle) {
  const versionName = getVersionName(config);
  if (versionName === null) {
    return buildGradle;
  }
  const pattern = new RegExp(`versionName ".*"`);
  return buildGradle.replace(pattern, `versionName "${versionName}"`);
}
function getVersionCode(config) {
  var _config$android$versi, _config$android;
  return (_config$android$versi = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.versionCode) !== null && _config$android$versi !== void 0 ? _config$android$versi : 1;
}
function setVersionCode(config, buildGradle) {
  const versionCode = getVersionCode(config);
  if (versionCode === null) {
    return buildGradle;
  }
  const pattern = new RegExp(`versionCode.*`);
  return buildGradle.replace(pattern, `versionCode ${versionCode}`);
}
//# sourceMappingURL=Version.js.map