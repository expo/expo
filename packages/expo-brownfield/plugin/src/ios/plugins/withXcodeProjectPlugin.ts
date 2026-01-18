import { type ConfigPlugin, withXcodeProject } from 'expo/config-plugins';
import path from 'node:path';

import type { PluginConfig } from '../types';
import {
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
    // Create the React Native host manager based on the template
    createFileFromTemplate('ReactNativeHostManager.swift', groupPath);
    // Create the messaging proxy based on the template
    createFileFromTemplate('Messaging.swift', groupPath);
    // Create the SwiftUI brownfield entrypoint based on the template
    createFileFromTemplate('ReactNativeView.swift', groupPath);
    // Create the UIKit brownfield view controller based on the template
    createFileFromTemplate('ReactNativeViewController.swift', groupPath);
    // Create the BrownfieldAppDelegate based on the template
    createFileFromTemplate('BrownfieldAppDelegate.swift', groupPath);
    // Create the ReactNativeDelegate based on the template
    createFileFromTemplate('ReactNativeDelegate.swift', groupPath);

    // Create and properly add a new group for the framework
    createGroup(xcodeProject, pluginConfig.targetName, groupPath, [
      'ReactNativeHostManager.swift',
      'Messaging.swift',
      'ReactNativeView.swift',
      'ReactNativeViewController.swift',
      'BrownfieldAppDelegate.swift',
      'ReactNativeDelegate.swift',
    ]);

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
    // - Add 'ReactNativeHostManager.swift', 'ReactNativeView.swift',
    //   'Messaging.swift', 'ReactNativeViewController.swift' and
    //   'BrownfieldAppDelegate.swift'
    //   to the compile sources phase
    configureBuildPhases(xcodeProject, target, pluginConfig.targetName, projectName, [
      `${pluginConfig.targetName}/ReactNativeHostManager.swift`,
      `${pluginConfig.targetName}/Messaging.swift`,
      `${pluginConfig.targetName}/ReactNativeView.swift`,
      `${pluginConfig.targetName}/ReactNativeViewController.swift`,
      `${pluginConfig.targetName}/BrownfieldAppDelegate.swift`,
      `${pluginConfig.targetName}/ReactNativeDelegate.swift`,
    ]);
    // Add the required build settings
    configureBuildSettings(
      xcodeProject,
      pluginConfig.targetName,
      config.ios?.buildNumber || '1',
      pluginConfig.bundleIdentifier
    );

    return config;
  });
};

export default withXcodeProjectPlugin;
