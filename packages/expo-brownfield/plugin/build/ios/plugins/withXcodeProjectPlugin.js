"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const node_path_1 = __importDefault(require("node:path"));
const utils_1 = require("../utils");
const withXcodeProjectPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const projectName = config.modRequest.projectName ?? (0, utils_1.inferProjectName)(config.modRequest.platformProjectRoot);
        const projectRoot = config.modRequest.projectRoot;
        const xcodeProject = config.modResults;
        // Create a target for the framework
        const target = (0, utils_1.createFramework)(xcodeProject, pluginConfig.targetName, pluginConfig.bundleIdentifier);
        // Create a directory for the framework files
        const groupPath = node_path_1.default.join(projectRoot, 'ios', pluginConfig.targetName);
        (0, utils_1.mkdir)(groupPath);
        const templateFiles = [
            // React Native host manager
            'ReactNativeHostManager.swift',
            // Messaging proxy
            'Messaging.swift',
            //SwiftUI brownfield entrypoint
            'ReactNativeView.swift',
            // UIKit brownfield view controller
            'ReactNativeViewController.swift',
            // ExpoAppDelegate symlinked and reexported from the main Expo package
            'ExpoAppDelegate.swift',
            // ReactNativeDelegate
            'ReactNativeDelegate.swift',
        ];
        // Create files from templates
        templateFiles.forEach((templateFile) => (0, utils_1.createFileFromTemplate)(templateFile, groupPath));
        // Apply patch to ExpoAppDelegate.swift to make it compatible with the brownfield framework
        (0, utils_1.applyPatchToFile)('ExpoAppDelegate.patch', node_path_1.default.join(groupPath, 'ExpoAppDelegate.swift'));
        // Create and properly add a new group for the framework
        (0, utils_1.createGroup)(xcodeProject, pluginConfig.targetName, groupPath, templateFiles);
        // Create 'Info.plist' and '<target-name>.entitlements' based on the templates
        (0, utils_1.createFileFromTemplate)('Info.plist', groupPath, {
            bundleIdentifier: pluginConfig.bundleIdentifier,
            targetName: pluginConfig.targetName,
        });
        (0, utils_1.createFileFromTemplateAs)('Target.entitlements', groupPath, pluginConfig.targetName + '.entitlements');
        // Configure build phases:
        // - Reference Expo app target's RN bundle script
        // - Add custom script for patching ExpoModulesProvider
        // - Add template files to the compile sources phase
        (0, utils_1.configureBuildPhases)(xcodeProject, target, pluginConfig.targetName, projectName, templateFiles.map((file) => `${pluginConfig.targetName}/${file}`));
        // Add the required build settings
        (0, utils_1.configureBuildSettings)(xcodeProject, pluginConfig.targetName, config.ios?.buildNumber || '1', pluginConfig.bundleIdentifier, config.ios?.version || config.version);
        return config;
    });
};
exports.default = withXcodeProjectPlugin;
