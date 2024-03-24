"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getSupportsScreen = getSupportsScreen;
exports.withDeviceFamily = exports.setSupportsScreens = void 0;
function _() {
  const data = require("..");
  _ = function () {
    return data;
  };
  return data;
}
function getSupportsScreen(config) {
  return config.android?.supportsScreens ?? {};
}
const setSupportsScreens = (config, supportsScreensConfig) => {
  const supportsScreensAttributes = {
    ...(supportsScreensConfig.smallScreens !== undefined && {
      'android:smallScreens': supportsScreensConfig.smallScreens?.toString()
    }),
    ...(supportsScreensConfig.normalScreens !== undefined && {
      'android:normalScreens': supportsScreensConfig.normalScreens?.toString()
    }),
    ...(supportsScreensConfig.largeScreens !== undefined && {
      'android:largeScreens': supportsScreensConfig.largeScreens?.toString()
    }),
    ...(supportsScreensConfig.xlargeScreens !== undefined && {
      'android:xlargeScreens': supportsScreensConfig.xlargeScreens?.toString()
    }),
    ...(supportsScreensConfig.anyDensity !== undefined && {
      'android:anyDensity': supportsScreensConfig.anyDensity?.toString()
    }),
    ...(supportsScreensConfig.requiresSmallestWidthDp !== undefined && {
      'android:requiresSmallestWidthDp': supportsScreensConfig.requiresSmallestWidthDp?.toString()
    }),
    ...(supportsScreensConfig.compatibleWidthLimitDp !== undefined && {
      'android:compatibleWidthLimitDp': supportsScreensConfig.compatibleWidthLimitDp?.toString()
    }),
    ...(supportsScreensConfig.largestWidthLimitDp !== undefined && {
      'android:largestWidthLimitDp': supportsScreensConfig.largestWidthLimitDp?.toString()
    })
  };
  if (Object.keys(supportsScreensAttributes).length > 0) {
    config.modResults.manifest['supports-screens'] = [{
      $: supportsScreensAttributes
    }];
  }
  return config;
};
exports.setSupportsScreens = setSupportsScreens;
const withDeviceFamily = config => {
  const supportsScreensConfig = getSupportsScreen(config);
  return (0, _().withAndroidManifest)(config, async config => {
    return setSupportsScreens(config, supportsScreensConfig);
  });
};
exports.withDeviceFamily = withDeviceFamily;
var _default = exports.default = withDeviceFamily;
//# sourceMappingURL=DeviceFamily.js.map