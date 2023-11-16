"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBuildNumber = exports.getBuildNumber = exports.setVersion = exports.getVersion = exports.withBuildNumber = exports.withVersion = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withVersion = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setVersion, {
    infoPlistProperty: 'CFBundleShortVersionString',
    expoConfigProperty: 'version',
}, 'withVersion');
exports.withBuildNumber = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setBuildNumber, {
    infoPlistProperty: 'CFBundleVersion',
    expoConfigProperty: 'ios.buildNumber',
}, 'withBuildNumber');
function getVersion(config) {
    return config.version || '1.0.0';
}
exports.getVersion = getVersion;
function setVersion(config, infoPlist) {
    return {
        ...infoPlist,
        CFBundleShortVersionString: getVersion(config),
    };
}
exports.setVersion = setVersion;
function getBuildNumber(config) {
    return config.ios?.buildNumber ? config.ios.buildNumber : '1';
}
exports.getBuildNumber = getBuildNumber;
function setBuildNumber(config, infoPlist) {
    return {
        ...infoPlist,
        CFBundleVersion: getBuildNumber(config),
    };
}
exports.setBuildNumber = setBuildNumber;
