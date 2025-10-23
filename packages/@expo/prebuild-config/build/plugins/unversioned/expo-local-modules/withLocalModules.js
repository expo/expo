"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withInlineModules = exports.default = void 0;
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
const withInlineModules = (config, props) => {
  config = createBuildGradlePropsConfigPlugin([{
    propName: 'expo.inlineModules.enabled',
    propValueGetter: conf => (conf.experiments?.inlineModules === true).toString()
  }, {
    propName: 'expo.inlineModules.watchedDirectories',
    propValueGetter: conf => {
      if (conf.experiments?.inlineModules !== true) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.inlineModules?.watchedDirectories ?? []);
    }
  }], 'withAndroidInlineModules')(config);
  config = createBuildPodfilePropsConfigPlugin([{
    propName: 'expo.inlineModules.enabled',
    propValueGetter: conf => (conf.experiments?.inlineModules === true).toString()
  }, {
    propName: 'expo.inlineModules.watchedDirectories',
    propValueGetter: conf => {
      if (conf.experiments?.inlineModules !== true) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.inlineModules?.watchedDirectories ?? []);
    }
  }], 'withIosInlineModules')(config);
  return config;
};
exports.withInlineModules = withInlineModules;
var _default = exports.default = withInlineModules;
//# sourceMappingURL=withInlineModules.js.map