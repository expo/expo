"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _createLegacyPlugin() {
  const data = require("./createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-document-picker',
  fallback(config) {
    var _config$ios;
    if ((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.usesIcloudStorage) {
      _configPlugins().WarningAggregator.addWarningIOS('ios.usesIcloudStorage', 'Install expo-document-picker to enable the ios.usesIcloudStorage feature'
      // TODO: add a link to a docs page with more information on how to do this
      );
    }
    return config;
  }
});
exports.default = _default;
//# sourceMappingURL=expo-document-picker.js.map