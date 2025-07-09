"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_ORIENTATION_KEY = void 0;
exports.setInitialOrientation = setInitialOrientation;
const assert_1 = __importDefault(require("assert"));
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-screen-orientation/package.json');
// This value must match the `EXDefaultScreenOrientationMask` string used in `expo-screen-orientation/ios/EXScreenOrientation/EXScreenOrientationViewController.m` (do not change).
exports.INITIAL_ORIENTATION_KEY = 'EXDefaultScreenOrientationMask';
const OrientationLock = {
    DEFAULT: 'UIInterfaceOrientationMaskAllButUpsideDown',
    ALL: 'UIInterfaceOrientationMaskAll',
    PORTRAIT: 'UIInterfaceOrientationMaskPortrait',
    PORTRAIT_UP: 'UIInterfaceOrientationMaskPortrait',
    PORTRAIT_DOWN: 'UIInterfaceOrientationMaskPortraitUpsideDown',
    LANDSCAPE: 'UIInterfaceOrientationMaskLandscape',
    LANDSCAPE_LEFT: 'UIInterfaceOrientationMaskLandscapeLeft',
    LANDSCAPE_RIGHT: 'UIInterfaceOrientationMaskLandscapeRight',
};
const withScreenOrientationViewController = (config, { initialOrientation } = {}) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const extendedConfig = {
            ...config,
            initialOrientation,
        };
        config.modResults = setInitialOrientation(extendedConfig, config.modResults);
        return config;
    });
    return config;
};
function setInitialOrientation(config, infoPlist) {
    const initialOrientation = config.initialOrientation;
    if (!initialOrientation) {
        delete infoPlist[exports.INITIAL_ORIENTATION_KEY];
        return infoPlist;
    }
    (0, assert_1.default)(initialOrientation in OrientationLock, `Invalid initial orientation "${initialOrientation}" expected one of: ${Object.keys(OrientationLock).join(', ')}`);
    infoPlist[exports.INITIAL_ORIENTATION_KEY] = OrientationLock[initialOrientation];
    return infoPlist;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withScreenOrientationViewController, pkg.name, pkg.version);
