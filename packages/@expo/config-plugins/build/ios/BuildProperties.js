"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIosBuildProperty = exports.updateIosBuildPropertiesFromConfig = exports.withJsEnginePodfileProps = exports.createBuildPodfilePropsConfigPlugin = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
/**
 * Creates a `withPodfileProperties` config-plugin based on given config to property mapping rules.
 *
 * The factory supports two modes from generic type inference
 * ```ts
 * // config-plugin without `props`, it will implicitly use the expo config as source config.
 * createBuildPodfilePropsConfigPlugin<ExpoConfig>(): ConfigPlugin<void>;
 *
 * // config-plugin with a parameter `props: CustomType`, it will use the `props` as source config.
 * createBuildPodfilePropsConfigPlugin<CustomType>(): ConfigPlugin<CustomType>;
 * ```
 *
 * @param configToPropertyRules config to property mapping rules
 * @param name the config plugin name
 */
function createBuildPodfilePropsConfigPlugin(configToPropertyRules, name) {
    const withUnknown = (config, sourceConfig) => (0, ios_plugins_1.withPodfileProperties)(config, (config) => {
        config.modResults = updateIosBuildPropertiesFromConfig((sourceConfig ?? config), config.modResults, configToPropertyRules);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createBuildPodfilePropsConfigPlugin = createBuildPodfilePropsConfigPlugin;
/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
exports.withJsEnginePodfileProps = createBuildPodfilePropsConfigPlugin([
    {
        propName: 'expo.jsEngine',
        propValueGetter: (config) => config.ios?.jsEngine ?? config.jsEngine ?? 'hermes',
    },
], 'withJsEnginePodfileProps');
function updateIosBuildPropertiesFromConfig(config, podfileProperties, configToPropertyRules) {
    for (const configToProperty of configToPropertyRules) {
        const value = configToProperty.propValueGetter(config);
        updateIosBuildProperty(podfileProperties, configToProperty.propName, value);
    }
    return podfileProperties;
}
exports.updateIosBuildPropertiesFromConfig = updateIosBuildPropertiesFromConfig;
function updateIosBuildProperty(podfileProperties, name, value, options) {
    if (value) {
        podfileProperties[name] = value;
    }
    else if (options?.removePropWhenValueIsNull) {
        delete podfileProperties[name];
    }
    return podfileProperties;
}
exports.updateIosBuildProperty = updateIosBuildProperty;
