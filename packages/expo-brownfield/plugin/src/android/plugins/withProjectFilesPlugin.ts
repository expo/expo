import { type ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';
import path from 'node:path';

import { applyPatchToFile, checkPlugin, mkdir } from '../../common';
import type { PluginConfig } from '../types';
import { createFileFromTemplate, createFileFromTemplateAs } from '../utils';

const withProjectFilesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withAndroidManifest(config, (config) => {
    // Define paths for the brownfield target
    const brownfieldPath = path.join(
      pluginConfig.projectRoot,
      `android/${pluginConfig.libraryName}`
    );
    const brownfieldMainPath = path.join(brownfieldPath, 'src/main/');
    const brownfieldSourcesPath = path.join(brownfieldMainPath, pluginConfig.packagePath);

    // The fused sibling sits next to the brownfield library so AGP's
    // `com.android.fused-library` plugin can `include(project(":<expoModule>"))` from
    // the same Gradle build. It carries no sources — only an `include()` list. Built
    // only when the user opts in via `expo-brownfield build:android --fused`.
    const fusedPath = path.join(
      pluginConfig.projectRoot,
      `android/${pluginConfig.libraryName}-fused`
    );

    // Create directory for the brownfield library sources
    // (and all intermediate directories)
    mkdir(brownfieldSourcesPath, true);
    mkdir(fusedPath, true);

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

    // Emit the fused sibling's build.gradle.kts. The template lives at
    // packages/expo-brownfield/plugin/templates/android/fused/build.gradle.kts.
    // It is only assembled when the user runs `expo-brownfield build:android --fused`.
    createFileFromTemplateAs(
      path.join('fused', 'build.gradle.kts'),
      fusedPath,
      'build.gradle.kts',
      {
        packageId: pluginConfig.package,
        groupId: pluginConfig.group,
        version: pluginConfig.version,
        libraryName: pluginConfig.libraryName,
      }
    );

    // Adjust ReactNativeHostManager and BrownfieldActivity to initialize dev menu
    if (checkPlugin(config, 'expo-dev-menu')) {
      applyPatchToFile(
        'ReactNativeHostManager.patch',
        path.join(brownfieldSourcesPath, 'ReactNativeHostManager.kt')
      );
      applyPatchToFile(
        'BrownfieldActivity.patch',
        path.join(brownfieldSourcesPath, 'BrownfieldActivity.kt')
      );
      applyPatchToFile('build.gradle.patch', path.join(brownfieldPath, 'build.gradle.kts'));
    }

    return config;
  });
};

export default withProjectFilesPlugin;
