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
function escapeXMLCharacters(original) {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

// Note that this main target name is based on how `@expo/cli/src/prebuild/renameTemplateAppNameAsync.ts` preprocesses the ios project template.
// It is neccesary to match the target name in the path to ExpoModulesProvider.swift for the main target as is used when generating it.
function getMainTargetName(config) {
  const name = config.name;
  const safeName = escapeXMLCharacters(name);
  return _configPlugins().IOSConfig.XcodeUtils.sanitizedName(safeName);
}
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
          mainTarget: getMainTargetName(config),
          targets: []
        });
      }
      return JSON.stringify({
        targets: xcodeProjectTargets
      });
    }
  }], 'withIosInlineModules')(config);
  return config;
};
exports.withInlineModules = withInlineModules;
var _default = exports.default = withInlineModules;
//# sourceMappingURL=withInlineModules.js.map