var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var ReactNativeVersion = require("./ReactNativeVersion");
exports.checkVersions = function checkVersions() {
  var nativeVersion = _Platform.default.constants.reactNativeVersion;
  if (ReactNativeVersion.version.major !== nativeVersion.major || ReactNativeVersion.version.minor !== nativeVersion.minor) {
    console.error(`React Native version mismatch.\n\nJavaScript version: ${_formatVersion(ReactNativeVersion.version)}\n` + `Native version: ${_formatVersion(nativeVersion)}\n\n` + 'Make sure that you have rebuilt the native code. If the problem ' + 'persists try clearing the Watchman and packager caches with ' + '`watchman watch-del-all && react-native start --reset-cache`.');
  }
};
function _formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}` + (version.prerelease != undefined ? `-${version.prerelease}` : '');
}
//# sourceMappingURL=ReactNativeVersionCheck.js.map