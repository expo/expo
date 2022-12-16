"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPrimaryColor = getPrimaryColor;
exports.withPrimaryColorStyles = exports.withPrimaryColorColors = exports.withPrimaryColor = void 0;
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
function _Colors() {
  const data = require("./Colors");
  _Colors = function () {
    return data;
  };
  return data;
}
function _Styles() {
  const data = require("./Styles");
  _Styles = function () {
    return data;
  };
  return data;
}
const COLOR_PRIMARY_KEY = 'colorPrimary';
const DEFAULT_PRIMARY_COLOR = '#023c69';
const withPrimaryColor = config => {
  config = withPrimaryColorColors(config);
  config = withPrimaryColorStyles(config);
  return config;
};
exports.withPrimaryColor = withPrimaryColor;
const withPrimaryColorColors = config => {
  return (0, _androidPlugins().withAndroidColors)(config, config => {
    config.modResults = (0, _Colors().assignColorValue)(config.modResults, {
      name: COLOR_PRIMARY_KEY,
      value: getPrimaryColor(config)
    });
    return config;
  });
};
exports.withPrimaryColorColors = withPrimaryColorColors;
const withPrimaryColorStyles = config => {
  return (0, _androidPlugins().withAndroidStyles)(config, config => {
    config.modResults = (0, _Styles().assignStylesValue)(config.modResults, {
      add: !!getPrimaryColor(config),
      parent: (0, _Styles().getAppThemeLightNoActionBarGroup)(),
      name: COLOR_PRIMARY_KEY,
      value: `@color/${COLOR_PRIMARY_KEY}`
    });
    return config;
  });
};
exports.withPrimaryColorStyles = withPrimaryColorStyles;
function getPrimaryColor(config) {
  var _config$primaryColor;
  return (_config$primaryColor = config.primaryColor) !== null && _config$primaryColor !== void 0 ? _config$primaryColor : DEFAULT_PRIMARY_COLOR;
}
//# sourceMappingURL=PrimaryColor.js.map