"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const utils_1 = require("../utils");
const EXPO_APPLY_STATEMENT = 'apply plugin: "expo-root-project"';
const PLUGIN_CLASSPATH = 'expo.modules:publish';
const PLUGIN_NAME = 'expo-brownfield-publish';
const withProjectBuildGradlePlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withProjectBuildGradle)(config, (config) => {
        if (config.modResults.contents.includes(PLUGIN_CLASSPATH)) {
            return config;
        }
        let lines = config.modResults.contents.split('\n');
        lines = addPluginClasspathStatement(lines);
        lines = addApplyStatement(lines);
        lines = addPublicationConfiguration(lines, pluginConfig.publishing, pluginConfig.projectRoot, pluginConfig.libraryName);
        config.modResults.contents = lines.join('\n');
        return config;
    });
};
const addPluginClasspathStatement = (lines) => {
    const statement = `    classpath('${PLUGIN_CLASSPATH}')`;
    const lastClasspathIndex = lines.findLastIndex((line) => line.includes('classpath('));
    lines = [
        ...lines.slice(0, lastClasspathIndex + 1),
        statement,
        ...lines.slice(lastClasspathIndex + 1),
    ];
    return lines;
};
const addApplyStatement = (lines) => {
    const statement = `apply plugin: "${PLUGIN_NAME}"`;
    const expoApplyIndex = lines.findIndex((line) => line.includes(EXPO_APPLY_STATEMENT));
    if (expoApplyIndex === -1) {
        throw new Error('Error: "expo-root-project" apply statement not found in the project build.gradle file');
    }
    lines = [...lines.slice(0, expoApplyIndex + 1), statement, ...lines.slice(expoApplyIndex + 1)];
    return lines;
};
const addPublicationConfiguration = (lines, publications, projectRoot, libraryName) => {
    lines = [
        ...lines,
        'expoBrownfieldPublishPlugin {',
        getBrownfieldLibraryConfiguration(libraryName),
        '  publications {',
        ...createPublicationConfigurations(publications, projectRoot),
        '  }',
        '}',
    ];
    return lines;
};
const createPublicationConfigurations = (publications, projectRoot) => {
    const configs = [];
    publications.forEach((publication) => {
        configs.push(...(0, utils_1.addRepository)(configs, projectRoot, publication));
    });
    return configs;
};
const getBrownfieldLibraryConfiguration = (libraryName) => {
    return `  libraryName = "${libraryName}"`;
};
exports.default = withProjectBuildGradlePlugin;
