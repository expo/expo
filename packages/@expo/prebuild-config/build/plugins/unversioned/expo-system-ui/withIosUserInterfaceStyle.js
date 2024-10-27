"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserInterfaceStyle = getUserInterfaceStyle;
exports.setUserInterfaceStyle = setUserInterfaceStyle;
exports.withIosUserInterfaceStyle = void 0;
function _iosPlugins() {
  const data = require("@expo/config-plugins/build/plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
const withIosUserInterfaceStyle = exports.withIosUserInterfaceStyle = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setUserInterfaceStyle, {
  infoPlistProperty: 'UIUserInterfaceStyle',
  expoConfigProperty: 'userInterfaceStyle | ios.userInterfaceStyle',
  expoPropertyGetter: getUserInterfaceStyle
}, 'withIosUserInterfaceStyle');
function getUserInterfaceStyle(config) {
  return config.ios?.userInterfaceStyle ?? config.userInterfaceStyle ?? 'light';
}
function setUserInterfaceStyle(config, {
  UIUserInterfaceStyle,
  ...infoPlist
}) {
  const userInterfaceStyle = getUserInterfaceStyle(config);
  const style = mapUserInterfaceStyleForInfoPlist(userInterfaceStyle);
  if (!style) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    UIUserInterfaceStyle: style
  };
}
function mapUserInterfaceStyleForInfoPlist(userInterfaceStyle) {
  switch (userInterfaceStyle) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'automatic':
      return 'Automatic';
  }
  return null;
}
//# sourceMappingURL=withIosUserInterfaceStyle.js.map