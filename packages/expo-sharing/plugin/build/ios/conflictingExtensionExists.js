"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflictingExtensionExists = conflictingExtensionExists;
function conflictingExtensionExists(xcodeProject, targetName, bundleIdentifier) {
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    const existingTarget = Object.values(nativeTargets).find((target) => target.name && unquote(target.name) === targetName);
    if (existingTarget) {
        const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
        const configurationList = xcodeProject.pbxXCConfigurationList()[existingTarget.buildConfigurationList];
        const buildConfiguration = buildConfigurations[configurationList.buildConfigurations[0].value];
        const existingBundleIdentifier = unquote(buildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER);
        return existingBundleIdentifier === bundleIdentifier ? 'exists' : 'exists-conflicting';
    }
    return 'doesnt-exist';
}
function unquote(str) {
    if (str)
        return str.replace(/^"(.*)"$/, '$1');
    return str;
}
