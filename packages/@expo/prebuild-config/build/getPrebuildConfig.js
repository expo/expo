"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrebuildConfigAsync = void 0;
const config_1 = require("@expo/config");
const getAutolinkedPackages_1 = require("./getAutolinkedPackages");
const withDefaultPlugins_1 = require("./plugins/withDefaultPlugins");
async function getPrebuildConfigAsync(projectRoot, props) {
    const autolinkedModules = await (0, getAutolinkedPackages_1.getAutolinkedPackagesAsync)(projectRoot, props.platforms);
    return getPrebuildConfig(projectRoot, {
        ...props,
        autolinkedModules,
    });
}
exports.getPrebuildConfigAsync = getPrebuildConfigAsync;
function getPrebuildConfig(projectRoot, { platforms, bundleIdentifier, packageName, autolinkedModules, }) {
    // let config: ExpoConfig;
    let { exp: config, ...rest } = (0, config_1.getConfig)(projectRoot, {
        skipSDKVersionRequirement: true,
        isModdedConfig: true,
    });
    if (autolinkedModules) {
        if (!config._internal) {
            config._internal = {};
        }
        config._internal.autolinkedModules = autolinkedModules;
    }
    // Add all built-in plugins first because they should take
    // priority over the unversioned plugins.
    config = (0, withDefaultPlugins_1.withVersionedExpoSDKPlugins)(config);
    config = (0, withDefaultPlugins_1.withLegacyExpoPlugins)(config);
    if (platforms.includes('ios')) {
        if (!config.ios)
            config.ios = {};
        config.ios.bundleIdentifier =
            bundleIdentifier ?? config.ios.bundleIdentifier ?? `com.placeholder.appid`;
        // Add all built-in plugins
        config = (0, withDefaultPlugins_1.withIosExpoPlugins)(config, {
            bundleIdentifier: config.ios.bundleIdentifier,
        });
    }
    if (platforms.includes('android')) {
        if (!config.android)
            config.android = {};
        config.android.package = packageName ?? config.android.package ?? `com.placeholder.appid`;
        // Add all built-in plugins
        config = (0, withDefaultPlugins_1.withAndroidExpoPlugins)(config, {
            package: config.android.package,
        });
    }
    return { exp: config, ...rest };
}
