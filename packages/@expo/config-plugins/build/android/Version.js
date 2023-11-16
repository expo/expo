"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVersionCode = exports.getVersionCode = exports.setVersionName = exports.getVersionName = exports.setMinBuildScriptExtVersion = exports.withBuildScriptExtMinimumVersion = exports.withVersion = void 0;
const android_plugins_1 = require("../plugins/android-plugins");
const warnings_1 = require("../utils/warnings");
const withVersion = (config) => {
    return (0, android_plugins_1.withAppBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setVersionCode(config, config.modResults.contents);
            config.modResults.contents = setVersionName(config, config.modResults.contents);
        }
        else {
            (0, warnings_1.addWarningAndroid)('android.versionCode', `Cannot automatically configure app build.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withVersion = withVersion;
/** Sets a numeric version for a value in the project.gradle buildscript.ext object to be at least the provided props.minVersion, if the existing value is greater then no change will be made. */
const withBuildScriptExtMinimumVersion = (config, props) => {
    return (0, android_plugins_1.withProjectBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setMinBuildScriptExtVersion(config.modResults.contents, props);
        }
        else {
            (0, warnings_1.addWarningAndroid)('withBuildScriptExtVersion', `Cannot automatically configure project build.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withBuildScriptExtMinimumVersion = withBuildScriptExtMinimumVersion;
function setMinBuildScriptExtVersion(buildGradle, { name, minVersion }) {
    const regex = new RegExp(`(${name}\\s?=\\s?)(\\d+(?:\\.\\d+)?)`);
    const currentVersion = buildGradle.match(regex)?.[2];
    if (!currentVersion) {
        (0, warnings_1.addWarningAndroid)('withBuildScriptExtVersion', `Cannot set minimum buildscript.ext.${name} version because the property "${name}" cannot be found or does not have a numeric value.`);
        // TODO: Maybe just add the property...
        return buildGradle;
    }
    const currentVersionNum = Number(currentVersion);
    return buildGradle.replace(regex, `$1${Math.max(minVersion, currentVersionNum)}`);
}
exports.setMinBuildScriptExtVersion = setMinBuildScriptExtVersion;
function getVersionName(config) {
    return config.version ?? null;
}
exports.getVersionName = getVersionName;
function setVersionName(config, buildGradle) {
    const versionName = getVersionName(config);
    if (versionName === null) {
        return buildGradle;
    }
    const pattern = new RegExp(`versionName ".*"`);
    return buildGradle.replace(pattern, `versionName "${versionName}"`);
}
exports.setVersionName = setVersionName;
function getVersionCode(config) {
    return config.android?.versionCode ?? 1;
}
exports.getVersionCode = getVersionCode;
function setVersionCode(config, buildGradle) {
    const versionCode = getVersionCode(config);
    if (versionCode === null) {
        return buildGradle;
    }
    const pattern = new RegExp(`versionCode.*`);
    return buildGradle.replace(pattern, `versionCode ${versionCode}`);
}
exports.setVersionCode = setVersionCode;
