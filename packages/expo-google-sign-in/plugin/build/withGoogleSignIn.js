"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setExcludedArchitectures = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-google-sign-in/package.json');
/**
 * Exclude building for arm64 on simulator devices in the pbxproj project.
 * Without this, production builds targeting simulators will fail.
 */
function setExcludedArchitectures(project) {
    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
        // Guessing that this is the best way to emulate Xcode.
        // Using `project.addToBuildSettings` modifies too many targets.
        if (typeof (buildSettings === null || buildSettings === void 0 ? void 0 : buildSettings.PRODUCT_NAME) !== 'undefined') {
            buildSettings['"EXCLUDED_ARCHS[sdk=iphonesimulator*]"'] = '"arm64"';
        }
    }
    return project;
}
exports.setExcludedArchitectures = setExcludedArchitectures;
const withExcludedSimulatorArchitectures = (c) => {
    return config_plugins_1.withXcodeProject(c, (config) => {
        config.modResults = setExcludedArchitectures(config.modResults);
        return config;
    });
};
const withGoogleSignIn = (config) => {
    return withExcludedSimulatorArchitectures(config);
};
exports.default = config_plugins_1.createRunOncePlugin(withGoogleSignIn, pkg.name, pkg.version);
//# sourceMappingURL=withGoogleSignIn.js.map