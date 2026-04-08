"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBuildPodfilePropsConfigPlugin = createBuildPodfilePropsConfigPlugin;
exports.updateIosBuildPropertiesFromConfig = updateIosBuildPropertiesFromConfig;
exports.updateIosBuildProperty = updateIosBuildProperty;
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
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
function createBuildPodfilePropsConfigPlugin(configToPropertyRules, name) {
  const withUnknown = (config, sourceConfig) => (0, _iosPlugins().withPodfileProperties)(config, config => {
    config.modResults = updateIosBuildPropertiesFromConfig(sourceConfig ?? config, config.modResults, configToPropertyRules);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
}
function updateIosBuildPropertiesFromConfig(config, podfileProperties, configToPropertyRules) {
  for (const configToProperty of configToPropertyRules) {
    const value = configToProperty.propValueGetter(config);
    updateIosBuildProperty(podfileProperties, configToProperty.propName, value);
  }
  return podfileProperties;
}
function updateIosBuildProperty(podfileProperties, name, value, options) {
  if (value) {
    podfileProperties[name] = value;
  } else if (options?.removePropWhenValueIsNull) {
    delete podfileProperties[name];
  }
  return podfileProperties;
}
//# sourceMappingURL=BuildProperties.js.map