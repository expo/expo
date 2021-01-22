"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyObjcAppDelegate = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const assert_1 = __importDefault(require("assert"));
const fs = __importStar(require("fs-extra"));
const pkg = require('expo-screen-orientation/package.json');
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
function modifyObjcAppDelegate(contents, mask) {
    // Add import
    if (!contents.includes('#import <EXScreenOrientation/EXScreenOrientationViewController.h>')) {
        contents = contents.replace(/#import "AppDelegate.h"/g, `#import "AppDelegate.h"
#import <EXScreenOrientation/EXScreenOrientationViewController.h>`);
    }
    // Change View Controller
    if (!contents.includes('[EXScreenOrientationViewController alloc]')) {
        contents = contents.replace(/UIViewController\s?\*\s?rootViewController\s?=\s?\[UIViewController new\];/g, `UIViewController *rootViewController = [[EXScreenOrientationViewController alloc] initWithDefaultScreenOrientationMask:${mask}];`);
    }
    return contents;
}
exports.modifyObjcAppDelegate = modifyObjcAppDelegate;
const withScreenOrientationViewController = (config, { initialOrientation = 'DEFAULT' } = {}) => {
    assert_1.default(initialOrientation in OrientationLock, `Invalid initial orientation "${initialOrientation}" expected one of: ${Object.keys(OrientationLock).join(', ')}`);
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        async (config) => {
            const fileInfo = config_plugins_1.IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
            let contents = await fs.readFile(fileInfo.path, 'utf-8');
            if (fileInfo.language === 'objc') {
                contents = modifyObjcAppDelegate(contents, OrientationLock[initialOrientation]);
            }
            else {
                // TODO: Support Swift
                throw new Error(`Cannot append screen orientation view controller to AppDelegate of language "${fileInfo.language}"`);
            }
            await fs.writeFile(fileInfo.path, contents);
            return config;
        },
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
