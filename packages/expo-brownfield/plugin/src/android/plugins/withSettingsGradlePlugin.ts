import { type ConfigPlugin, withSettingsGradle } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

const withSettingsGradlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents += getBrownfieldIncludeStatement(pluginConfig.libraryName);
    config.modResults.contents += getBrownfieldPluginIncludeStatement();
    return config;
  });
};

// The fused sibling Gradle subproject (sourceless, applies `com.android.fused-library`)
// is always emitted so it can be targeted on demand by `expo-brownfield build:android --fused`.
// It's idle in default mode — no tasks run, nothing is built.
const getBrownfieldIncludeStatement = (libraryName: string) => {
  return [
    `include ':${libraryName}'`,
    `include ':${libraryName}-fused'`,
    '',
  ].join('\n');
};

const getBrownfieldPluginIncludeStatement = () => {
  const lines = [
    `def brownfieldPluginsPath = new File(`,
    `  providers.exec {`,
    `    workingDir(rootDir)`,
    `    commandLine("node", "--print", "require.resolve('expo-brownfield/package.json')")`,
    `  }.standardOutput.asText.get().trim(),`,
    `  "../gradle-plugins"`,
    `).absolutePath`,
    `includeBuild(brownfieldPluginsPath)`,
  ];
  return lines.join('\n');
};

export default withSettingsGradlePlugin;
