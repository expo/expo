"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withLocalModules = exports.default = void 0;
function _configPlugins() {
  const data = require("expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const {
  createBuildGradlePropsConfigPlugin
} = _configPlugins().AndroidConfig.BuildProperties;
const {
  createBuildPodfilePropsConfigPlugin
} = _configPlugins().IOSConfig.BuildProperties;
const withLocalModules = (config, props) => {
  config = createBuildGradlePropsConfigPlugin([{
    propName: 'expo.localModules.enabled',
    propValueGetter: conf => (conf.experiments?.localModules === true).toString()
  }, {
    propName: 'expo.localModules.watchedDirs',
    propValueGetter: conf => {
      if (conf.experiments?.localModules !== true) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.localModules?.watchedDirs ?? []);
    }
  }], 'withAndroidLocalModules')(config);
  config = createBuildPodfilePropsConfigPlugin([{
    propName: 'expo.localModules.enabled',
    propValueGetter: conf => (conf.experiments?.localModules === true).toString()
  }, {
    propName: 'expo.localModules.watchedDirs',
    propValueGetter: conf => {
      if (conf.experiments?.localModules !== true) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.localModules?.watchedDirs ?? []);
    }
  }], 'withIosLocalModules')(config);
  return config;
};
exports.withLocalModules = withLocalModules;
var _default = exports.default = withLocalModules;
//# sourceMappingURL=withLocalModules.js.map