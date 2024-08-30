"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-sqlite/package.json');
const withSQLite = (config, props) => {
    config = withSQLiteAndroidProps(config, props);
    config = withSQLiteIOSProps(config, props);
    return config;
};
const withSQLiteAndroidProps = (config, props) => {
    return (0, config_plugins_1.withGradleProperties)(config, (config) => {
        const customBuildFlags = props.android?.customBuildFlags ?? props.customBuildFlags;
        const enableFTS = props.android?.enableFTS ?? props.enableFTS;
        const useSQLCipher = props.android?.useSQLCipher ?? props.useSQLCipher;
        config.modResults = updateAndroidBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.customBuildFlags', customBuildFlags);
        config.modResults = updateAndroidBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.enableFTS', enableFTS);
        config.modResults = updateAndroidBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.useSQLCipher', useSQLCipher);
        return config;
    });
};
const withSQLiteIOSProps = (config, props) => {
    return (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        const customBuildFlags = props.ios?.customBuildFlags ?? props.customBuildFlags;
        const enableFTS = props.ios?.enableFTS ?? props.enableFTS;
        const useSQLCipher = props.ios?.useSQLCipher ?? props.useSQLCipher;
        config.modResults = updateIOSBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.customBuildFlags', customBuildFlags);
        config.modResults = updateIOSBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.enableFTS', enableFTS);
        config.modResults = updateIOSBuildPropertyIfNeeded(config.modResults, 'expo.sqlite.useSQLCipher', useSQLCipher);
        return config;
    });
};
function updateAndroidBuildPropertyIfNeeded(properties, name, value) {
    if (value !== undefined) {
        return config_plugins_1.AndroidConfig.BuildProperties.updateAndroidBuildProperty(properties, name, String(value));
    }
    return properties;
}
function updateIOSBuildPropertyIfNeeded(properties, name, value) {
    if (value !== undefined) {
        properties[name] = String(value);
        return properties;
    }
    return properties;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSQLite, pkg.name, pkg.version);
