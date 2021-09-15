"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyObjcAppDelegate = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
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
            let contents = fs_1.default.readFileSync(fileInfo.path, { encoding: 'utf-8' });
            if (fileInfo.language === 'objc') {
                contents = modifyObjcAppDelegate(contents, OrientationLock[initialOrientation]);
            }
            else {
                // TODO: Support Swift
                throw new Error(`Cannot append screen orientation view controller to AppDelegate of language "${fileInfo.language}"`);
            }
            fs_1.default.writeFileSync(fileInfo.path, contents);
            return config;
        },
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withScreenOrientationViewController, pkg.name, pkg.version);
