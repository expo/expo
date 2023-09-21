Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _browser = require("./environment/browser");
var Platform = {
  OS: _reactNative.Platform.OS,
  select: _reactNative.Platform.select,
  isDOMAvailable: _browser.isDOMAvailable,
  canUseEventListeners: _browser.canUseEventListeners,
  canUseViewport: _browser.canUseViewport,
  isAsyncDebugging: _browser.isAsyncDebugging
};
var _default = Platform;
exports.default = _default;