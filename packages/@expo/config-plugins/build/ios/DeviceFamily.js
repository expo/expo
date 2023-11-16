"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDeviceFamily = exports.formatDeviceFamilies = exports.getDeviceFamilies = exports.getIsTabletOnly = exports.getSupportsTablet = exports.withDeviceFamily = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
const warnings_1 = require("../utils/warnings");
const withDeviceFamily = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, async (config) => {
        config.modResults = await setDeviceFamily(config, {
            project: config.modResults,
        });
        return config;
    });
};
exports.withDeviceFamily = withDeviceFamily;
function getSupportsTablet(config) {
    return !!config.ios?.supportsTablet;
}
exports.getSupportsTablet = getSupportsTablet;
function getIsTabletOnly(config) {
    return !!config?.ios?.isTabletOnly;
}
exports.getIsTabletOnly = getIsTabletOnly;
function getDeviceFamilies(config) {
    const supportsTablet = getSupportsTablet(config);
    const isTabletOnly = getIsTabletOnly(config);
    if (isTabletOnly && config.ios?.supportsTablet === false) {
        (0, warnings_1.addWarningIOS)('ios.supportsTablet', `Found contradictory values: \`{ ios: { isTabletOnly: true, supportsTablet: false } }\`. Using \`{ isTabletOnly: true }\`.`);
    }
    // 1 is iPhone, 2 is iPad
    if (isTabletOnly) {
        return [2];
    }
    else if (supportsTablet) {
        return [1, 2];
    }
    else {
        // is iPhone only
        return [1];
    }
}
exports.getDeviceFamilies = getDeviceFamilies;
/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
function formatDeviceFamilies(deviceFamilies) {
    return `"${deviceFamilies.join(',')}"`;
}
exports.formatDeviceFamilies = formatDeviceFamilies;
/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
function setDeviceFamily(config, { project }) {
    const deviceFamilies = formatDeviceFamilies(getDeviceFamilies(config));
    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
        // Guessing that this is the best way to emulate Xcode.
        // Using `project.addToBuildSettings` modifies too many targets.
        if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
            if (typeof buildSettings?.TVOS_DEPLOYMENT_TARGET !== 'undefined') {
                buildSettings.TARGETED_DEVICE_FAMILY = '3';
            }
            else {
                buildSettings.TARGETED_DEVICE_FAMILY = deviceFamilies;
            }
        }
    }
    return project;
}
exports.setDeviceFamily = setDeviceFamily;
