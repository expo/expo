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
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyObjcAppDelegate = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs-extra"));
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
            let contents = await fs.readFile(fileInfo.path, 'utf-8');
            if (fileInfo.language === 'objc') {
                contents = modifyObjcAppDelegate(contents);
            }
            else {
                // TODO: Support Swift
                throw new Error(`Cannot add Firebase code to AppDelegate of language "${fileInfo.language}"`);
            }
            await fs.writeFile(fileInfo.path, contents);
            return config;
        },
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withFirebaseAppDelegate, pkg.name, pkg.version);
