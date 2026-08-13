"use strict";

exports.__esModule = true;
exports.METRO_PORT_INFO_PLIST_KEY = void 0;
exports.setMetroPort = setMetroPort;
exports.withMetroPort = void 0;
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
/**
 * Info.plist key read by expo's native runtime (`ExpoReactNativeFactory`) to resolve the Metro
 * dev server port at launch. It is set to the `RCT_METRO_PORT` build setting so that
 * `expo run:ios --port <n>` flows through to the app.
 *
 * Prebuilt React freezes the compile-time `RCT_METRO_PORT` at `8081`, so without this a bare dev
 * build (no `expo-dev-client`) always defaults to `:8081` and multiple running projects collide on
 * a single dev server. This is the iOS analog of Android's `react_native_dev_server_port` resource.
 */
const METRO_PORT_INFO_PLIST_KEY = exports.METRO_PORT_INFO_PLIST_KEY = 'RCTMetroPort';
const withMetroPort = exports.withMetroPort = (0, _iosPlugins().createInfoPlistPlugin)(setMetroPort, 'withMetroPort');
function setMetroPort(_config, infoPlist) {
  return {
    ...infoPlist,
    [METRO_PORT_INFO_PLIST_KEY]: '$(RCT_METRO_PORT)'
  };
}
//# sourceMappingURL=DevServer.js.map