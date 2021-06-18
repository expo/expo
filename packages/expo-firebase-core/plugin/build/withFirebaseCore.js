"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyObjcAppDelegate = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const pkg = require('expo-firebase-core/package.json');
const methodInvocationBlock = `[FIRApp configure];`;
function modifyObjcAppDelegate(contents) {
    // Add import
    if (!contents.includes('@import Firebase;')) {
        contents = contents.replace(/#import "AppDelegate.h"/g, `#import "AppDelegate.h"
@import Firebase;`);
    }
    // Add invocation
    if (!contents.includes(methodInvocationBlock)) {
        // self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]
        contents = contents.replace(/self\.moduleRegistryAdapter = \[\[UMModuleRegistryAdapter alloc\]/g, `${methodInvocationBlock}
self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc]`);
    }
    return contents;
}
exports.modifyObjcAppDelegate = modifyObjcAppDelegate;
const withFirebaseAppDelegate = config => {
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        async (config) => {
            const fileInfo = config_plugins_1.IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
            let contents = fs_1.default.readFileSync(fileInfo.path, { encoding: 'utf8' });
            if (fileInfo.language === 'objc') {
                contents = modifyObjcAppDelegate(contents);
            }
            else {
                // TODO: Support Swift
                throw new Error(`Cannot add Firebase code to AppDelegate of language "${fileInfo.language}"`);
            }
            fs_1.default.writeFileSync(fileInfo.path, contents);
            return config;
        },
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withFirebaseAppDelegate, pkg.name, pkg.version);
