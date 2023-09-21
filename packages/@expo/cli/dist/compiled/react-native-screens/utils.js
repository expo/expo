Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeNativeBackPress = executeNativeBackPress;
exports.isSearchBarAvailableForCurrentPlatform = exports.isNewBackTitleImplementation = void 0;
var _reactNative = require("react-native");
var isSearchBarAvailableForCurrentPlatform = ['ios', 'android'].includes(_reactNative.Platform.OS);
exports.isSearchBarAvailableForCurrentPlatform = isSearchBarAvailableForCurrentPlatform;
function executeNativeBackPress() {
  _reactNative.BackHandler.exitApp();
  return true;
}
var isNewBackTitleImplementation = true;
exports.isNewBackTitleImplementation = isNewBackTitleImplementation;