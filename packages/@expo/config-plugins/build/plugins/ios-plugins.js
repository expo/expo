"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPodfileProperties = exports.withXcodeProject = exports.withExpoPlist = exports.withEntitlementsPlist = exports.withInfoPlist = exports.withAppDelegate = exports.createEntitlementsPlugin = exports.createInfoPlistPluginWithPropertyGuard = exports.createInfoPlistPlugin = void 0;
const withMod_1 = require("./withMod");
const obj_1 = require("../utils/obj");
const warnings_1 = require("../utils/warnings");
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
function createInfoPlistPlugin(action, name) {
    const withUnknown = (config) => (0, exports.withInfoPlist)(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createInfoPlistPlugin = createInfoPlistPlugin;
function createInfoPlistPluginWithPropertyGuard(action, settings, name) {
    const withUnknown = (config) => (0, exports.withInfoPlist)(config, async (config) => {
        const existingProperty = settings.expoPropertyGetter
            ? settings.expoPropertyGetter(config)
            : (0, obj_1.get)(config, settings.expoConfigProperty);
        // If the user explicitly sets a value in the infoPlist, we should respect that.
        if (config.modRawConfig.ios?.infoPlist?.[settings.infoPlistProperty] === undefined) {
            config.modResults = await action(config, config.modResults);
        }
        else if (existingProperty !== undefined) {
            // Only warn if there is a conflict.
            (0, warnings_1.addWarningIOS)(settings.expoConfigProperty, `"ios.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`);
        }
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createInfoPlistPluginWithPropertyGuard = createInfoPlistPluginWithPropertyGuard;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
function createEntitlementsPlugin(action, name) {
    const withUnknown = (config) => (0, exports.withEntitlementsPlist)(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createEntitlementsPlugin = createEntitlementsPlugin;
/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
const withAppDelegate = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'appDelegate',
        action,
    });
};
exports.withAppDelegate = withAppDelegate;
/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.ios.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
const withInfoPlist = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'infoPlist',
        async action(config) {
            config = await action(config);
            if (!config.ios) {
                config.ios = {};
            }
            config.ios.infoPlist = config.modResults;
            return config;
        },
    });
};
exports.withInfoPlist = withInfoPlist;
/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.ios.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
const withEntitlementsPlist = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'entitlements',
        async action(config) {
            config = await action(config);
            if (!config.ios) {
                config.ios = {};
            }
            config.ios.entitlements = config.modResults;
            return config;
        },
    });
};
exports.withEntitlementsPlist = withEntitlementsPlist;
/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
const withExpoPlist = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'expoPlist',
        action,
    });
};
exports.withExpoPlist = withExpoPlist;
/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
const withXcodeProject = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'xcodeproj',
        action,
    });
};
exports.withXcodeProject = withXcodeProject;
/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
const withPodfileProperties = (config, action) => {
    return (0, withMod_1.withMod)(config, {
        platform: 'ios',
        mod: 'podfileProperties',
        action,
    });
};
exports.withPodfileProperties = withPodfileProperties;
