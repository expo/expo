"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOrientation = exports.LANDSCAPE_ORIENTATIONS = exports.PORTRAIT_ORIENTATIONS = exports.getOrientation = exports.withOrientation = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withOrientation = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setOrientation, {
    infoPlistProperty: 'UISupportedInterfaceOrientations',
    expoConfigProperty: 'orientation',
}, 'withOrientation');
function getOrientation(config) {
    return config.orientation ?? null;
}
exports.getOrientation = getOrientation;
exports.PORTRAIT_ORIENTATIONS = [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationPortraitUpsideDown',
];
exports.LANDSCAPE_ORIENTATIONS = [
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
];
function getUISupportedInterfaceOrientations(orientation) {
    if (orientation === 'portrait') {
        return exports.PORTRAIT_ORIENTATIONS;
    }
    else if (orientation === 'landscape') {
        return exports.LANDSCAPE_ORIENTATIONS;
    }
    else {
        return [...exports.PORTRAIT_ORIENTATIONS, ...exports.LANDSCAPE_ORIENTATIONS];
    }
}
function setOrientation(config, infoPlist) {
    const orientation = getOrientation(config);
    return {
        ...infoPlist,
        UISupportedInterfaceOrientations: getUISupportedInterfaceOrientations(orientation),
    };
}
exports.setOrientation = setOrientation;
