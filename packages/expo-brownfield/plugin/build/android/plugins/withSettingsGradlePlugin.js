"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withSettingsGradlePlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withSettingsGradle)(config, (config) => {
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
const getBrownfieldIncludeStatements = (libraryName) => {
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
exports.default = withSettingsGradlePlugin;
