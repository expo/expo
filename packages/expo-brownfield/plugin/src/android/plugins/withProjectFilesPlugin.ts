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

    const fusedReleasePath = path.join(
      pluginConfig.projectRoot,
      `android/${pluginConfig.libraryName}-fused-release`
    );
    const fusedDebugPath = path.join(
      pluginConfig.projectRoot,
      `android/${pluginConfig.libraryName}-fused-debug`
    );

    // Create directory for the brownfield library sources
    // (and all intermediate directories)
    mkdir(brownfieldSourcesPath, true);
    mkdir(fusedReleasePath, true);
    mkdir(fusedDebugPath, true);

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

    // Emit the fused siblings' build.gradle.kts files. Same template at
    // packages/expo-brownfield/plugin/templates/android/fused/build.gradle.kts —
    // `fusedVariant` is the only difference: substituted as "release" or "debug",
    // it drives the namespace suffix, publication name, and which build type the
    // sibling resolves and fuses.
    const fusedTemplate = path.join('fused', 'build.gradle.kts');
    const fusedBaseVars = {
      packageId: pluginConfig.package,
      groupId: pluginConfig.group,
      version: pluginConfig.version,
      libraryName: pluginConfig.libraryName,
    };
    createFileFromTemplateAs(fusedTemplate, fusedReleasePath, 'build.gradle.kts', {
      ...fusedBaseVars,
      fusedVariant: 'release',
    });
    createFileFromTemplateAs(fusedTemplate, fusedDebugPath, 'build.gradle.kts', {
      ...fusedBaseVars,
      fusedVariant: 'debug',
    });

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
