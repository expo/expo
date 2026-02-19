import { type ConfigPlugin, withXcodeProject } from 'expo/config-plugins';
import path from 'node:path';

import type { PluginConfig } from '../types';
import {
  applyPatchToFile,
  configureBuildPhases,
  configureBuildSettings,
  createFileFromTemplate,
  createFileFromTemplateAs,
  createFramework,
  createGroup,
  inferProjectName,
  mkdir,
} from '../utils';

const withXcodeProjectPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withXcodeProject(config, (config) => {
    const projectName =
      config.modRequest.projectName ?? inferProjectName(config.modRequest.platformProjectRoot);
    const projectRoot = config.modRequest.projectRoot;
    const xcodeProject = config.modResults;

    // Create a target for the framework
    const target = createFramework(
      xcodeProject,
      pluginConfig.targetName,
      pluginConfig.bundleIdentifier
    );

    // Create a directory for the framework files
    const groupPath = path.join(projectRoot, 'ios', pluginConfig.targetName);
    mkdir(groupPath);

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
    templateFiles.forEach((templateFile) => createFileFromTemplate(templateFile, groupPath));

    // Apply patch to ExpoAppDelegate.swift to make it compatible with the brownfield framework
    applyPatchToFile('ExpoAppDelegate.patch', path.join(groupPath, 'ExpoAppDelegate.swift'));

    // Create and properly add a new group for the framework
    createGroup(xcodeProject, pluginConfig.targetName, groupPath, templateFiles);

    // Create 'Info.plist' and '<target-name>.entitlements' based on the templates
    createFileFromTemplate('Info.plist', groupPath, {
      bundleIdentifier: pluginConfig.bundleIdentifier,
      targetName: pluginConfig.targetName,
    });
    createFileFromTemplateAs(
      'Target.entitlements',
      groupPath,
      pluginConfig.targetName + '.entitlements'
    );

    // Configure build phases:
    // - Reference Expo app target's RN bundle script
    // - Add custom script for patching ExpoModulesProvider
    // - Add template files to the compile sources phase
    configureBuildPhases(
      xcodeProject,
      target,
      pluginConfig.targetName,
      projectName,
      templateFiles.map((file) => `${pluginConfig.targetName}/${file}`)
    );
    // Add the required build settings
    configureBuildSettings(
      xcodeProject,
      pluginConfig.targetName,
      config.ios?.buildNumber || '1',
      pluginConfig.bundleIdentifier,
      config.ios?.version || config.version
    );

    return config;
  });
};

export default withXcodeProjectPlugin;
