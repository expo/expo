"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAndroidUserInterfaceStyle = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withAndroidUserInterfaceStyle = config => {
  return (0, _configPlugins().withStringsXml)(config, config => {
    var _config$android$userI, _config$android;
    const userInterfaceStyle = (_config$android$userI = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.userInterfaceStyle) !== null && _config$android$userI !== void 0 ? _config$android$userI : config.userInterfaceStyle;
    if (userInterfaceStyle) {
      _configPlugins().WarningAggregator.addWarningAndroid('userInterfaceStyle',
      // TODO: Maybe warn that they need a certain version of React Native as well?
      'Install expo-system-ui in your project to enable this feature.');
    }
    return config;
  });
};
exports.withAndroidUserInterfaceStyle = withAndroidUserInterfaceStyle;
//# sourceMappingURL=withAndroidUserInterfaceStyle.js.map