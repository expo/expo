"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootViewBackgroundColor = getRootViewBackgroundColor;
exports.withRootViewBackgroundColorStyles = exports.withRootViewBackgroundColorColors = exports.withAndroidRootViewBackgroundColor = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const {
  assignColorValue
} = _configPlugins().AndroidConfig.Colors;
const {
  assignStylesValue,
  getAppThemeLightNoActionBarGroup
} = _configPlugins().AndroidConfig.Styles;
const ANDROID_WINDOW_BACKGROUND = 'android:windowBackground';
const WINDOW_BACKGROUND_COLOR = 'activityBackground';
const withAndroidRootViewBackgroundColor = config => {
  config = withRootViewBackgroundColorColors(config);
  config = withRootViewBackgroundColorStyles(config);
  return config;
};
exports.withAndroidRootViewBackgroundColor = withAndroidRootViewBackgroundColor;
const withRootViewBackgroundColorColors = config => {
  return (0, _configPlugins().withAndroidColors)(config, async config => {
    config.modResults = assignColorValue(config.modResults, {
      value: getRootViewBackgroundColor(config),
      name: WINDOW_BACKGROUND_COLOR
    });
    return config;
  });
};
exports.withRootViewBackgroundColorColors = withRootViewBackgroundColorColors;
const withRootViewBackgroundColorStyles = config => {
  return (0, _configPlugins().withAndroidStyles)(config, async config => {
    config.modResults = assignStylesValue(config.modResults, {
      add: !!getRootViewBackgroundColor(config),
      parent: getAppThemeLightNoActionBarGroup(),
      name: ANDROID_WINDOW_BACKGROUND,
      value: `@color/${WINDOW_BACKGROUND_COLOR}`
    });
    return config;
  });
};
exports.withRootViewBackgroundColorStyles = withRootViewBackgroundColorStyles;
function getRootViewBackgroundColor(config) {
  var _config$android;
  return ((_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.backgroundColor) || config.backgroundColor || null;
}
//# sourceMappingURL=withAndroidRootViewBackgroundColor.js.map