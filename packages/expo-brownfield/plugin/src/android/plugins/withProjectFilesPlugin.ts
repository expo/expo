import { type ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';
import path from 'node:path';

import { mkdir } from '../../common';
import type { PluginConfig } from '../types';
import { createFileFromTemplate } from '../utils';

const withProjectFilesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withAndroidManifest(config, (config) => {
    // Define paths for the brownfield target
    const brownfieldPath = path.join(
      pluginConfig.projectRoot,
      `android/${pluginConfig.libraryName}`
    );
    const brownfieldMainPath = path.join(brownfieldPath, 'src/main/');
    const brownfieldSourcesPath = path.join(brownfieldMainPath, pluginConfig.packagePath);

    // Create directory for the brownfield library sources
    // (and all intermediate directories)
    mkdir(brownfieldSourcesPath, true);

    // Add files from templates to the brownfield library:
    // - AndroidManifest.xml
    // - BrownfieldActivity.kt
    // - ReactNativeHostManager.kt
    // - ReactNativeViewFactory.kt
    // - ReactNativeFragment.kt
    // - build.gradle.kts
    // - proguard-rules.pro
    // - consumer-rules.pro
    createFileFromTemplate('AndroidManifest.xml', brownfieldMainPath);
    createFileFromTemplate('BrownfieldActivity.kt', brownfieldSourcesPath, {
      packageId: pluginConfig.package,
    });
    createFileFromTemplate('ReactNativeHostManager.kt', brownfieldSourcesPath, {
      packageId: pluginConfig.package,
    });
    createFileFromTemplate('ReactNativeViewFactory.kt', brownfieldSourcesPath, {
      packageId: pluginConfig.package,
    });
    createFileFromTemplate('ReactNativeFragment.kt', brownfieldSourcesPath, {
      packageId: pluginConfig.package,
    });
    createFileFromTemplate('build.gradle.kts', brownfieldPath, {
      packageId: pluginConfig.package,
      groupId: pluginConfig.group,
      version: pluginConfig.version,
    });
    createFileFromTemplate('proguard-rules.pro', brownfieldPath);
    createFileFromTemplate('consumer-rules.pro', brownfieldPath);

    return config;
  });
};

export default withProjectFilesPlugin;
