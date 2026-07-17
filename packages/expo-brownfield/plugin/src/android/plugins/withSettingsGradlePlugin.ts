import { type ConfigPlugin, withSettingsGradle } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

const withSettingsGradlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents += getBrownfieldIncludeStatement(pluginConfig.libraryName);
    config.modResults.contents += getBrownfieldPluginIncludeStatement();
    return config;
  });
};

// Two fused sibling Gradle subprojects (sourceless, applies `com.android.fused-library`)
// are always emitted — one per variant — so each can be targeted on demand by
// `expo-brownfield build:android --fused --release` / `--debug` / `--all`. They're
// idle in default mode — no tasks run, nothing is built.
const getBrownfieldIncludeStatement = (libraryName: string) => {
  return [
    `include ':${libraryName}'`,
    `include ':${libraryName}-fused-release'`,
    `include ':${libraryName}-fused-debug'`,
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
