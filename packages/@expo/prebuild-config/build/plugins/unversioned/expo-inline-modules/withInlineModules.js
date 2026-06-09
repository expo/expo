"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withInlineModules = exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
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
    propName: 'expo.inlineModules.watchedDirectories',
    propValueGetter: conf => {
      if (!conf.experiments?.inlineModules) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
    }
  }], 'withAndroidInlineModules')(config);
  config = createBuildPodfilePropsConfigPlugin([{
    propName: 'expo.inlineModules.watchedDirectories',
    propValueGetter: conf => {
      if (!conf.experiments?.inlineModules) {
        return JSON.stringify([]);
      }
      return JSON.stringify(conf.experiments?.inlineModules?.watchedDirectories ?? []);
    }
  }, {
    propName: 'expo.inlineModules.xcodeProjectTargets',
    propValueGetter: conf => {
      const xcodeProjectTargets = conf.experiments?.inlineModules?.xcodeProjectTargets;
      if (!xcodeProjectTargets) {
        return JSON.stringify({
          all: true,
          targets: []
        });
      }
      return JSON.stringify({
        all: false,
        targets: xcodeProjectTargets
      });
    }
  }], 'withIosInlineModules')(config);
  return config;
};
exports.withInlineModules = withInlineModules;
var _default = exports.default = withInlineModules;
//# sourceMappingURL=withInlineModules.js.map