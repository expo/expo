"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_plugins_1 = require("expo/config-plugins");
const utils_1 = require("../utils");
const withXcodeProjectPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const projectName = config.modRequest.projectName ??
            (0, utils_1.inferProjectName)(config.modRequest.platformProjectRoot);
        const projectRoot = config.modRequest.projectRoot;
        const xcodeProject = config.modResults;
        // Create a target for the framework
        const target = (0, utils_1.createFramework)(xcodeProject, pluginConfig.targetName, pluginConfig.bundleIdentifier);
        // Create a directory for the framework files
        const groupPath = node_path_1.default.join(projectRoot, 'ios', pluginConfig.targetName);
        (0, utils_1.mkdir)(groupPath);
        // Create the React Native host manager based on the template
        (0, utils_1.createFileFromTemplate)('ReactNativeHostManager.swift', groupPath);
        // Create the messaging proxy based on the template
        (0, utils_1.createFileFromTemplate)('Messaging.swift', groupPath);
        // Create the SwiftUI brownfield entrypoint based on the template
        (0, utils_1.createFileFromTemplate)('ReactNativeView.swift', groupPath);
        // Create the UIKit brownfield view controller based on the template
        (0, utils_1.createFileFromTemplate)('ReactNativeViewController.swift', groupPath);
        // Create the ExpoAppDelegateWrapper based on the template
        (0, utils_1.createFileFromTemplate)('ExpoAppDelegateWrapper.swift', groupPath);
        // Create the BrownfieldAppDelegate based on the template
        (0, utils_1.createFileFromTemplate)('BrownfieldAppDelegate.swift', groupPath);
        // Create the ReactNativeDelegate based on the template
        (0, utils_1.createFileFromTemplate)('ReactNativeDelegate.swift', groupPath);
        // Create and properly add a new group for the framework
        (0, utils_1.createGroup)(xcodeProject, pluginConfig.targetName, groupPath, [
            'ReactNativeHostManager.swift',
            'Messaging.swift',
            'ReactNativeView.swift',
            'ReactNativeViewController.swift',
            'ExpoAppDelegateWrapper.swift',
            'BrownfieldAppDelegate.swift',
            'ReactNativeDelegate.swift',
        ]);
        // Create 'Info.plist' and '<target-name>.entitlements' based on the templates
        (0, utils_1.createFileFromTemplate)('Info.plist', groupPath, {
            bundleIdentifier: pluginConfig.bundleIdentifier,
            targetName: pluginConfig.targetName,
        });
        (0, utils_1.createFileFromTemplateAs)('Target.entitlements', groupPath, pluginConfig.targetName + '.entitlements');
        // Configure build phases:
        // - Reference Expo app target's RN bundle script
        // - Add custom script for patching ExpoModulesProvider
        // - Add 'ReactNativeHostManager.swift', 'ReactNativeView.swift',
        //   'Messaging.swift', 'ReactNativeViewController.swift' and
        //   'ExpoAppDelegateWrapper.swift' and 'BrownfieldAppDelegate.swift'
        //   to the compile sources phase
        (0, utils_1.configureBuildPhases)(xcodeProject, target, pluginConfig.targetName, projectName, [
            `${pluginConfig.targetName}/ReactNativeHostManager.swift`,
            `${pluginConfig.targetName}/Messaging.swift`,
            `${pluginConfig.targetName}/ReactNativeView.swift`,
            `${pluginConfig.targetName}/ReactNativeViewController.swift`,
            `${pluginConfig.targetName}/ExpoAppDelegateWrapper.swift`,
            `${pluginConfig.targetName}/BrownfieldAppDelegate.swift`,
            `${pluginConfig.targetName}/ReactNativeDelegate.swift`,
        ]);
        // Add the required build settings
        (0, utils_1.configureBuildSettings)(xcodeProject, pluginConfig.targetName, config.ios?.buildNumber || '1', pluginConfig.bundleIdentifier);
        return config;
    });
};
exports.default = withXcodeProjectPlugin;
