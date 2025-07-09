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
    const userInterfaceStyle = config.android?.userInterfaceStyle ?? config.userInterfaceStyle;
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