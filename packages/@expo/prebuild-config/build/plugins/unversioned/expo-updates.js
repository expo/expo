"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withExpoUpdates = exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
// Local unversioned updates plugin

const packageName = 'expo-updates';
const withExpoUpdates = config => {
  return (0, _configPlugins().withStaticPlugin)(config, {
    _isLegacyPlugin: true,
    // Pass props to the static plugin if it exists.
    plugin: packageName,
    // If the static plugin isn't found, use the unversioned one.
    fallback: (0, _configPlugins().createRunOncePlugin)(config => withUnversionedUpdates(config), packageName)
  });
};
exports.withExpoUpdates = withExpoUpdates;
const withUnversionedUpdates = config => {
  config = _configPlugins().AndroidConfig.Updates.withUpdates(config);
  config = _configPlugins().IOSConfig.Updates.withUpdates(config);
  return config;
};
var _default = withExpoUpdates;
exports.default = _default;
//# sourceMappingURL=expo-updates.js.map