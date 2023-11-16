"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProductName = exports.setName = exports.setDisplayName = exports.getName = exports.withProductName = exports.withName = exports.withDisplayName = void 0;
const Target_1 = require("./Target");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withDisplayName = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setDisplayName, {
    infoPlistProperty: 'CFBundleDisplayName',
    expoConfigProperty: 'name',
}, 'withDisplayName');
exports.withName = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setName, {
    infoPlistProperty: 'CFBundleName',
    expoConfigProperty: 'name',
}, 'withName');
/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
const withProductName = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, (config) => {
        config.modResults = setProductName(config, config.modResults);
        return config;
    });
};
exports.withProductName = withProductName;
function getName(config) {
    return typeof config.name === 'string' ? config.name : null;
}
exports.getName = getName;
/**
 * CFBundleDisplayName is used for most things: the name on the home screen, in
 * notifications, and others.
 */
function setDisplayName(configOrName, { CFBundleDisplayName, ...infoPlist }) {
    let name = null;
    if (typeof configOrName === 'string') {
        name = configOrName;
    }
    else {
        name = getName(configOrName);
    }
    if (!name) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        CFBundleDisplayName: name,
    };
}
exports.setDisplayName = setDisplayName;
/**
 * CFBundleName is recommended to be 16 chars or less and is used in lists, eg:
 * sometimes on the App Store
 */
function setName(config, { CFBundleName, ...infoPlist }) {
    const name = getName(config);
    if (!name) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        CFBundleName: name,
    };
}
exports.setName = setName;
function setProductName(config, project) {
    const name = (0, Xcodeproj_1.sanitizedName)(getName(config) ?? '');
    if (!name) {
        return project;
    }
    const quotedName = ensureQuotes(name);
    const [, nativeTarget] = (0, Target_1.findFirstNativeTarget)(project);
    (0, Xcodeproj_1.getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).forEach(([, item]) => {
        item.buildSettings.PRODUCT_NAME = quotedName;
    });
    return project;
}
exports.setProductName = setProductName;
const ensureQuotes = (value) => {
    if (!value.match(/^['"]/)) {
        return `"${value}"`;
    }
    return value;
};
