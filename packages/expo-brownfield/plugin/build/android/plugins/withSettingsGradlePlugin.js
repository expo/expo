"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withSettingsGradlePlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withSettingsGradle)(config, (config) => {
        config.modResults.contents += getBrownfieldIncludeStatement(pluginConfig.libraryName);
        config.modResults.contents += getBrownfieldPluginIncludeStatement();
        return config;
    });
};
const getBrownfieldIncludeStatement = (libraryName) => {
    return `include ':${libraryName}'\n`;
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
