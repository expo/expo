import { type ConfigPlugin, withSettingsGradle } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

const withSettingsGradlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withSettingsGradle(config, (config) => {
    // Append line-by-line so re-running prebuild without --clean (or after
    // upgrading from a version without the fused siblings) adds only what's
    // missing instead of duplicating the whole block.
    for (const line of getBrownfieldIncludeStatements(pluginConfig.libraryName)) {
      if (!config.modResults.contents.includes(line)) {
        config.modResults.contents += `${line}\n`;
      }
    }
    if (!config.modResults.contents.includes('includeBuild(brownfieldPluginsPath)')) {
      config.modResults.contents += getBrownfieldPluginIncludeStatement();
    }
    return config;
  });
};

// Two fused sibling Gradle subprojects (sourceless, applies `com.android.fused-library`)
// are always emitted — one per variant — so each can be targeted on demand by
// `expo-brownfield build:android --fused --release` / `--debug` / `--all`. Their
// build scripts are inert unless the CLI passes `-Pbrownfield.fused=true`, so in
// default mode they register no publications and resolve nothing.
const getBrownfieldIncludeStatements = (libraryName: string) => {
  return [
    `include ':${libraryName}'`,
    `include ':${libraryName}-fused-release'`,
    `include ':${libraryName}-fused-debug'`,
  ];
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
