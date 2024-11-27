"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withSdk52ReactNative77CompatAndroid = void 0;
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
// TODO(kudo,20241112): Remove this plugin when we drop support for SDK 52.
const withSdk52ReactNative77CompatAndroid = config => {
  return (0, _configPlugins().withProjectBuildGradle)(config, async config => {
    if (config.sdkVersion !== '52.0.0') {
      return config;
    }
    const reactNativeVersion = await queryReactNativeVersionAsync(config.modRequest.projectRoot);
    if (!reactNativeVersion || reactNativeVersion.minor !== 77) {
      return config;
    }
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setProjectBuildGradle(config.modResults.contents);
    } else {
      _configPlugins().WarningAggregator.addWarningAndroid('ReactNative77CompatPlugin', `Cannot automatically configure project build.gradle if it's not groovy`);
    }
    return config;
  });
};
exports.withSdk52ReactNative77CompatAndroid = withSdk52ReactNative77CompatAndroid;
function setProjectBuildGradle(contents) {
  // Update kotlinVersion
  const kotlinVersion = '2.0.21';
  let newContents = contents.replace(/\b(kotlinVersion\s*=\s*findProperty\('android.kotlinVersion'\)\s*\?: ['"])(1\.9\.\d+)(['"])/g, `$1${kotlinVersion}$3`);

  // Update ndkVersion
  const ndkVersion = '27.1.12297006';
  newContents = newContents.replace(/\b(ndkVersion\s*=\s*['"])(26.1.10909125)(['"])/g, `$1${ndkVersion}$3`);
  return newContents;
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
//# sourceMappingURL=ReactNative77CompatPlugin.js.map