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
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

// Copied from expo-location package, this gets used when the
// user has react-native-maps installed but not expo-location.
const withDefaultLocationPermissions = config => {
  var _config$_internal, _config$_internal2;
  const isLinked = !((_config$_internal = config._internal) !== null && _config$_internal !== void 0 && _config$_internal.autolinkedModules) || config._internal.autolinkedModules.includes('react-native-maps');
  // Only add location permissions if react-native-maps is installed.
  if ((_config$_internal2 = config._internal) !== null && _config$_internal2 !== void 0 && _config$_internal2.projectRoot && _resolveFrom().default.silent(config._internal.projectRoot, 'react-native-maps') && isLinked) {
    config = (0, _configPlugins().withInfoPlist)(config, config => {
      config.modResults.NSLocationWhenInUseUsageDescription = config.modResults.NSLocationWhenInUseUsageDescription || LOCATION_USAGE;
      return config;
    });
    return _configPlugins().AndroidConfig.Permissions.withPermissions(config, ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION']);
  }
  return config;
};
var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'react-native-maps',
  fallback: [_configPlugins().AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey, _configPlugins().IOSConfig.Maps.withMaps, withDefaultLocationPermissions]
});
exports.default = _default;
//# sourceMappingURL=react-native-maps.js.map