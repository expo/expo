"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const addBuildPhases_1 = require("./addBuildPhases");
const addPbxGroup_1 = require("./addPbxGroup");
const addProductFile_1 = require("./addProductFile");
const addTargetDependency_1 = require("./addTargetDependency");
const addToPbxNativeTargetSection_1 = require("./addToPbxNativeTargetSection");
const addToPbxProjectSection_1 = require("./addToPbxProjectSection");
const addXCConfigurationList_1 = require("./addXCConfigurationList");
const withTargetXcodeProject = (config, { targetName, targetBundleIdentifier, deploymentTarget, getFileUris }) => (0, config_plugins_1.withXcodeProject)(config, (config) => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.generateUuid();
    const groupName = 'Embed Foundation Extensions';
    const marketingVersion = config.version;
    // Mark the target as an Expo Widget
    // it is important because some functions in linked libraries (e.g. ExpoModulesCore) are not compatible with widgets.
    xcodeProject.addBuildProperty('IS_EXPO_WIDGET', 'YES', 'Debug', targetUuid);
    const xCConfigurationList = (0, addXCConfigurationList_1.addXCConfigurationList)(xcodeProject, {
        targetName,
        currentProjectVersion: config.ios.buildNumber || '1',
        bundleIdentifier: targetBundleIdentifier,
        deploymentTarget,
        marketingVersion,
    });
    const productFile = (0, addProductFile_1.addProductFile)(xcodeProject, {
        targetName,
        groupName,
    });
    const target = (0, addToPbxNativeTargetSection_1.addToPbxNativeTargetSection)(xcodeProject, {
        targetName,
        targetUuid,
        productFile,
        xCConfigurationList,
    });
    (0, addToPbxProjectSection_1.addToPbxProjectSection)(xcodeProject, target);
    (0, addTargetDependency_1.addTargetDependency)(xcodeProject, target);
    const swiftWidgetFiles = getFileUris().filter((file) => file.endsWith('.swift'));
    (0, addBuildPhases_1.addBuildPhases)(xcodeProject, {
        targetUuid,
        groupName,
        productFile,
        widgetFiles: swiftWidgetFiles,
    });
    (0, addPbxGroup_1.addPbxGroup)(xcodeProject, {
        targetName,
        widgetFiles: getFileUris(),
    });
    return config;
});
exports.default = withTargetXcodeProject;
