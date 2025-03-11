"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSdk52ReactNative78CompatAndroid = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
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
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
let cachedIsTargetSdkVersion = undefined;

// TODO(kudo,20241210): Remove this plugin when we drop support for SDK 52.
const withSdk52ReactNative78CompatAndroid = config => {
  config = withSdk52ReactNative78CompatAndroidAppGradle(config);
  config = withSdk52ReactNative78CompatAndroidProjectGradle(config);
  return config;
};
exports.withSdk52ReactNative78CompatAndroid = withSdk52ReactNative78CompatAndroid;
const withSdk52ReactNative78CompatAndroidAppGradle = config => {
  return (0, _configPlugins().withAppBuildGradle)(config, async config => {
    if (!(await isTargetSdkVersionAsync(config.modRequest.projectRoot, config.sdkVersion))) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(/jscFlavor = ['"]org\.webkit:android-jsc(-intl)?:\+['"]/gm, `jscFlavor = 'io.github.react-native-community:jsc-android$1:2026004.+'`);
    return config;
  });
};
const withSdk52ReactNative78CompatAndroidProjectGradle = config => {
  return (0, _configPlugins().withProjectBuildGradle)(config, async config => {
    if (!(await isTargetSdkVersionAsync(config.modRequest.projectRoot, config.sdkVersion))) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(/\ndef jscAndroidDir = new File\([\s\S]+?^\)\n/gm, '');
    config.modResults.contents = config.modResults.contents.replace(/^\s+maven \{\n\s+\/\/ Android JSC.*\n\s+url\(jscAndroidDir\)[\s\S]+?\}\n/gm, '');
    return config;
  });
};
async function isTargetSdkVersionAsync(projectRoot, sdkVersion) {
  if (cachedIsTargetSdkVersion !== undefined) {
    return cachedIsTargetSdkVersion;
  }
  cachedIsTargetSdkVersion = false;
  if (sdkVersion === '52.0.0') {
    const reactNativeVersion = await queryReactNativeVersionAsync(projectRoot);
    if (reactNativeVersion && _semver().default.gte(reactNativeVersion, '0.78.0')) {
      cachedIsTargetSdkVersion = true;
    }
  }
  return cachedIsTargetSdkVersion;
}
async function queryReactNativeVersionAsync(projectRoot) {
  const packageJsonPath = _resolveFrom().default.silent(projectRoot, 'react-native/package.json');
  if (packageJsonPath) {
    const packageJson = await _jsonFile().default.readAsync(packageJsonPath);
    const version = packageJson.version;
    if (typeof version === 'string') {
      return _semver().default.parse(version);
    }
  }
  return null;
}
//# sourceMappingURL=ReactNative78CompatPlugin.js.map