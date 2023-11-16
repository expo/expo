"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBitcode = exports.setBitcodeWithConfig = exports.getBitcode = exports.withCustomBitcode = exports.withBitcode = void 0;
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
const warnings_1 = require("../utils/warnings");
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
const withBitcode = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, async (config) => {
        config.modResults = await setBitcodeWithConfig(config, {
            project: config.modResults,
        });
        return config;
    });
};
exports.withBitcode = withBitcode;
/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
const withCustomBitcode = (config, bitcode) => {
    return (0, ios_plugins_1.withXcodeProject)(config, async (config) => {
        config.modResults = await setBitcode(bitcode, {
            project: config.modResults,
        });
        return config;
    });
};
exports.withCustomBitcode = withCustomBitcode;
/**
 * Get the bitcode preference from the Expo config.
 */
function getBitcode(config) {
    return config.ios?.bitcode;
}
exports.getBitcode = getBitcode;
/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
function setBitcodeWithConfig(config, { project }) {
    const bitcode = getBitcode(config);
    return setBitcode(bitcode, { project });
}
exports.setBitcodeWithConfig = setBitcodeWithConfig;
/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
function setBitcode(bitcode, { project }) {
    const isDefaultBehavior = bitcode == null;
    // If the value is undefined, then do nothing.
    if (isDefaultBehavior) {
        return project;
    }
    const targetName = typeof bitcode === 'string' ? bitcode : undefined;
    const isBitcodeEnabled = !!bitcode;
    if (targetName) {
        // Assert if missing
        const configs = Object.entries(project.pbxXCBuildConfigurationSection()).filter(Xcodeproj_1.isNotComment);
        const hasConfiguration = configs.find(([, configuration]) => configuration.name === targetName);
        if (hasConfiguration) {
            // If targetName is defined then disable bitcode everywhere.
            project.addBuildProperty('ENABLE_BITCODE', 'NO');
        }
        else {
            const names = [
                // Remove duplicates, wrap in double quotes, and sort alphabetically.
                ...new Set(configs.map(([, configuration]) => `"${configuration.name}"`)),
            ].sort();
            (0, warnings_1.addWarningIOS)('ios.bitcode', `No configuration named "${targetName}". Expected one of: ${names.join(', ')}.`);
        }
    }
    project.addBuildProperty('ENABLE_BITCODE', isBitcodeEnabled ? 'YES' : 'NO', targetName);
    return project;
}
exports.setBitcode = setBitcode;
