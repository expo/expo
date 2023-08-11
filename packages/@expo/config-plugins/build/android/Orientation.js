"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SCREEN_ORIENTATION_ATTRIBUTE = void 0;
exports.getOrientation = getOrientation;
exports.setAndroidOrientation = setAndroidOrientation;
exports.withOrientation = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation';
exports.SCREEN_ORIENTATION_ATTRIBUTE = SCREEN_ORIENTATION_ATTRIBUTE;
const withOrientation = (0, _androidPlugins().createAndroidManifestPlugin)(setAndroidOrientation, 'withOrientation');
exports.withOrientation = withOrientation;
function getOrientation(config) {
  return typeof config.orientation === 'string' ? config.orientation : null;
}
function setAndroidOrientation(config, androidManifest) {
  const orientation = getOrientation(config);
  // TODO: Remove this if we decide to remove any orientation configuration when not specified
  if (!orientation) {
    return androidManifest;
  }
  const mainActivity = (0, _Manifest().getMainActivityOrThrow)(androidManifest);
  mainActivity.$[SCREEN_ORIENTATION_ATTRIBUTE] = orientation !== 'default' ? orientation : 'unspecified';
  return androidManifest;
}
//# sourceMappingURL=Orientation.js.map