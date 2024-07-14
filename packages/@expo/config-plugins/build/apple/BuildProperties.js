"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBuildPodfilePropsConfigPlugin = void 0;
exports.updateAppleBuildPropertiesFromConfig = updateAppleBuildPropertiesFromConfig;
exports.updateAppleBuildProperty = updateAppleBuildProperty;
exports.withJsEnginePodfileProps = void 0;
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
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
const createBuildPodfilePropsConfigPlugin = applePlatform => (configToPropertyRules, name) => {
  const withUnknown = (config, sourceConfig) => (0, _applePlugins().withPodfileProperties)(applePlatform)(config, config => {
    config.modResults = updateAppleBuildPropertiesFromConfig(sourceConfig ?? config, config.modResults, configToPropertyRules);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
};

/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
exports.createBuildPodfilePropsConfigPlugin = createBuildPodfilePropsConfigPlugin;
const withJsEnginePodfileProps = applePlatform => createBuildPodfilePropsConfigPlugin(applePlatform)([{
  propName: 'expo.jsEngine',
  propValueGetter: config => config[applePlatform]?.jsEngine ?? config.jsEngine ?? 'hermes'
}], 'withJsEnginePodfileProps');
exports.withJsEnginePodfileProps = withJsEnginePodfileProps;
function updateAppleBuildPropertiesFromConfig(config, podfileProperties, configToPropertyRules) {
  for (const configToProperty of configToPropertyRules) {
    const value = configToProperty.propValueGetter(config);
    updateAppleBuildProperty(podfileProperties, configToProperty.propName, value);
  }
  return podfileProperties;
}
function updateAppleBuildProperty(podfileProperties, name, value, options) {
  if (value) {
    podfileProperties[name] = value;
  } else if (options?.removePropWhenValueIsNull) {
    delete podfileProperties[name];
  }
  return podfileProperties;
}
//# sourceMappingURL=BuildProperties.js.map