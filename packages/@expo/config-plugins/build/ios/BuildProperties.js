"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBuildPodfilePropsConfigPlugin = createBuildPodfilePropsConfigPlugin;
exports.updateIosBuildPropertiesFromConfig = updateIosBuildPropertiesFromConfig;
exports.updateIosBuildProperty = updateIosBuildProperty;
exports.withJsEnginePodfileProps = void 0;

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
    config.modResults = updateIosBuildPropertiesFromConfig(sourceConfig !== null && sourceConfig !== void 0 ? sourceConfig : config, config.modResults, configToPropertyRules);
    return config;
  });

  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }

  return withUnknown;
}
/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */


const withJsEnginePodfileProps = createBuildPodfilePropsConfigPlugin([{
  propName: 'expo.jsEngine',
  propValueGetter: config => {
    var _ref, _config$ios$jsEngine, _config$ios;

    return (_ref = (_config$ios$jsEngine = (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.jsEngine) !== null && _config$ios$jsEngine !== void 0 ? _config$ios$jsEngine : config.jsEngine) !== null && _ref !== void 0 ? _ref : 'jsc';
  }
}], 'withJsEnginePodfileProps');
exports.withJsEnginePodfileProps = withJsEnginePodfileProps;

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
  } else if (options !== null && options !== void 0 && options.removePropWhenValueIsNull) {
    delete podfileProperties[name];
  }

  return podfileProperties;
}
//# sourceMappingURL=BuildProperties.js.map