"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PORTRAIT_ORIENTATIONS = exports.LANDSCAPE_ORIENTATIONS = void 0;
exports.getOrientation = getOrientation;
exports.setOrientation = setOrientation;
exports.withOrientation = void 0;

function _iosPlugins() {
  const data = require("../plugins/ios-plugins");

  _iosPlugins = function () {
    return data;
  };

  return data;
}

const withOrientation = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setOrientation, {
  infoPlistProperty: 'UISupportedInterfaceOrientations',
  expoConfigProperty: 'orientation'
}, 'withOrientation');
exports.withOrientation = withOrientation;

function getOrientation(config) {
  var _config$orientation;

  return (_config$orientation = config.orientation) !== null && _config$orientation !== void 0 ? _config$orientation : null;
}

const PORTRAIT_ORIENTATIONS = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown'];
exports.PORTRAIT_ORIENTATIONS = PORTRAIT_ORIENTATIONS;
const LANDSCAPE_ORIENTATIONS = ['UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'];
exports.LANDSCAPE_ORIENTATIONS = LANDSCAPE_ORIENTATIONS;

function getUISupportedInterfaceOrientations(orientation) {
  if (orientation === 'portrait') {
    return PORTRAIT_ORIENTATIONS;
  } else if (orientation === 'landscape') {
    return LANDSCAPE_ORIENTATIONS;
  } else {
    return [...PORTRAIT_ORIENTATIONS, ...LANDSCAPE_ORIENTATIONS];
  }
}

function setOrientation(config, infoPlist) {
  const orientation = getOrientation(config);
  return { ...infoPlist,
    UISupportedInterfaceOrientations: getUISupportedInterfaceOrientations(orientation)
  };
}
//# sourceMappingURL=Orientation.js.map