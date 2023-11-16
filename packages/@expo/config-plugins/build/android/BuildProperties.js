"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAndroidBuildProperty = exports.updateAndroidBuildPropertiesFromConfig = exports.withJsEngineGradleProps = exports.createBuildGradlePropsConfigPlugin = void 0;
const android_plugins_1 = require("../plugins/android-plugins");
/**
 * Creates a `withGradleProperties` config-plugin based on given config to property mapping rules.
 *
 * The factory supports two modes from generic type inference
 * ```ts
 * // config-plugin without `props`, it will implicitly use the expo config as source config.
 * createBuildGradlePropsConfigPlugin<ExpoConfig>(): ConfigPlugin<void>;
 *
 * // config-plugin with a parameter `props: CustomType`, it will use the `props` as source config.
 * createBuildGradlePropsConfigPlugin<CustomType>(): ConfigPlugin<CustomType>;
 * ```
 *
 * @param configToPropertyRules config to property mapping rules
 * @param name the config plugin name
 */
function createBuildGradlePropsConfigPlugin(configToPropertyRules, name) {
    const withUnknown = (config, sourceConfig) => (0, android_plugins_1.withGradleProperties)(config, (config) => {
        config.modResults = updateAndroidBuildPropertiesFromConfig((sourceConfig ?? config), config.modResults, configToPropertyRules);
        return config;
    });
    if (name) {
        Object.defineProperty(withUnknown, 'name', {
            value: name,
        });
    }
    return withUnknown;
}
exports.createBuildGradlePropsConfigPlugin = createBuildGradlePropsConfigPlugin;
/**
 * A config-plugin to update `android/gradle.properties` from the `jsEngine` in expo config
 */
exports.withJsEngineGradleProps = createBuildGradlePropsConfigPlugin([
    {
        propName: 'hermesEnabled',
        propValueGetter: (config) => ((config.android?.jsEngine ?? config.jsEngine ?? 'hermes') === 'hermes').toString(),
    },
], 'withJsEngineGradleProps');
function updateAndroidBuildPropertiesFromConfig(config, gradleProperties, configToPropertyRules) {
    for (const configToProperty of configToPropertyRules) {
        const value = configToProperty.propValueGetter(config);
        updateAndroidBuildProperty(gradleProperties, configToProperty.propName, value);
    }
    return gradleProperties;
}
exports.updateAndroidBuildPropertiesFromConfig = updateAndroidBuildPropertiesFromConfig;
function updateAndroidBuildProperty(gradleProperties, name, value, options) {
    const oldPropIndex = gradleProperties.findIndex((prop) => prop.type === 'property' && prop.key === name);
    if (value) {
        // found the matched value, add or merge new property
        const newProp = {
            type: 'property',
            key: name,
            value,
        };
        if (oldPropIndex >= 0) {
            gradleProperties[oldPropIndex] = newProp;
        }
        else {
            gradleProperties.push(newProp);
        }
    }
    else if (options?.removePropWhenValueIsNull && oldPropIndex >= 0) {
        gradleProperties.splice(oldPropIndex, 1);
    }
    return gradleProperties;
}
exports.updateAndroidBuildProperty = updateAndroidBuildProperty;
