"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlugin = exports.setClassPath = exports.setGoogleServicesFile = exports.getGoogleServicesFilePath = exports.withGoogleServicesFile = exports.withApplyPlugin = exports.withClassPath = void 0;
const path_1 = __importDefault(require("path"));
const android_plugins_1 = require("../plugins/android-plugins");
const withDangerousMod_1 = require("../plugins/withDangerousMod");
const fs_1 = require("../utils/fs");
const warnings_1 = require("../utils/warnings");
const DEFAULT_TARGET_PATH = './android/app/google-services.json';
const googleServicesClassPath = 'com.google.gms:google-services';
const googleServicesPlugin = 'com.google.gms.google-services';
// NOTE(brentvatne): This may be annoying to keep up to date...
const googleServicesVersion = '4.3.3';
const withClassPath = (config) => {
    return (0, android_plugins_1.withProjectBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setClassPath(config, config.modResults.contents);
        }
        else {
            (0, warnings_1.addWarningAndroid)('android.googleServicesFile', `Cannot automatically configure project build.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withClassPath = withClassPath;
const withApplyPlugin = (config) => {
    return (0, android_plugins_1.withAppBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = applyPlugin(config, config.modResults.contents);
        }
        else {
            (0, warnings_1.addWarningAndroid)('android.googleServicesFile', `Cannot automatically configure app build.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withApplyPlugin = withApplyPlugin;
/**
 * Add `google-services.json` to project
 */
const withGoogleServicesFile = (config) => {
    return (0, withDangerousMod_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setGoogleServicesFile(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withGoogleServicesFile = withGoogleServicesFile;
function getGoogleServicesFilePath(config) {
    return config.android?.googleServicesFile ?? null;
}
exports.getGoogleServicesFilePath = getGoogleServicesFilePath;
async function setGoogleServicesFile(config, projectRoot, targetPath = DEFAULT_TARGET_PATH) {
    const partialSourcePath = getGoogleServicesFilePath(config);
    if (!partialSourcePath) {
        return false;
    }
    const completeSourcePath = path_1.default.resolve(projectRoot, partialSourcePath);
    const destinationPath = path_1.default.resolve(projectRoot, targetPath);
    try {
        await (0, fs_1.copyFilePathToPathAsync)(completeSourcePath, destinationPath);
    }
    catch (e) {
        console.log(e);
        throw new Error(`Cannot copy google-services.json from ${completeSourcePath} to ${destinationPath}. Please make sure the source and destination paths exist.`);
    }
    return true;
}
exports.setGoogleServicesFile = setGoogleServicesFile;
/**
 * Adding the Google Services plugin
 * NOTE(brentvatne): string replacement is a fragile approach! we need a
 * better solution than this.
 */
function setClassPath(config, buildGradle) {
    const googleServicesFile = getGoogleServicesFilePath(config);
    if (!googleServicesFile) {
        return buildGradle;
    }
    if (buildGradle.includes(googleServicesClassPath)) {
        return buildGradle;
    }
    //
    return buildGradle.replace(/dependencies\s?{/, `dependencies {
        classpath '${googleServicesClassPath}:${googleServicesVersion}'`);
}
exports.setClassPath = setClassPath;
function applyPlugin(config, appBuildGradle) {
    const googleServicesFile = getGoogleServicesFilePath(config);
    if (!googleServicesFile) {
        return appBuildGradle;
    }
    // Make sure the project does not have the plugin already
    const pattern = new RegExp(`apply\\s+plugin:\\s+['"]${googleServicesPlugin}['"]`);
    if (appBuildGradle.match(pattern)) {
        return appBuildGradle;
    }
    // Add it to the end of the file
    return appBuildGradle + `\napply plugin: '${googleServicesPlugin}'`;
}
exports.applyPlugin = applyPlugin;
