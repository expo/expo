"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendScheme = appendScheme;
exports.getScheme = getScheme;
exports.getSchemesFromPlist = getSchemesFromPlist;
exports.hasScheme = hasScheme;
exports.removeScheme = removeScheme;
exports.withScheme = exports.setScheme = void 0;
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
const withScheme = applePlatform => (0, _applePlugins().createInfoPlistPluginWithPropertyGuard)(applePlatform)((config, infoPlist) => setScheme(applePlatform)(config, infoPlist), {
  infoPlistProperty: 'CFBundleURLTypes',
  expoConfigProperty: 'scheme'
}, 'withScheme');
exports.withScheme = withScheme;
function getScheme(config) {
  if (Array.isArray(config.scheme)) {
    const validate = value => {
      return typeof value === 'string';
    };
    return config.scheme.filter(validate);
  } else if (typeof config.scheme === 'string') {
    return [config.scheme];
  }
  return [];
}
const setScheme = applePlatform => (config, infoPlist) => {
  const scheme = [...getScheme(config),
  // @ts-ignore: TODO: `ios.scheme` / `macos.scheme` is an unreleased -- harder to add to turtle v1.
  ...getScheme(config[applePlatform] ?? {})];
  // Add the bundle identifier to the list of schemes for easier Google auth and parity with Turtle v1.
  if (config[applePlatform]?.bundleIdentifier) {
    scheme.push(config[applePlatform].bundleIdentifier);
  }
  if (scheme.length === 0) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    CFBundleURLTypes: [{
      CFBundleURLSchemes: scheme
    }]
  };
};
exports.setScheme = setScheme;
function appendScheme(scheme, infoPlist) {
  if (!scheme) {
    return infoPlist;
  }
  const existingSchemes = infoPlist.CFBundleURLTypes ?? [];
  if (existingSchemes?.some(({
    CFBundleURLSchemes
  }) => CFBundleURLSchemes.includes(scheme))) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    CFBundleURLTypes: [...existingSchemes, {
      CFBundleURLSchemes: [scheme]
    }]
  };
}
function removeScheme(scheme, infoPlist) {
  if (!scheme) {
    return infoPlist;
  }

  // No need to remove if we don't have any
  if (!infoPlist.CFBundleURLTypes) {
    return infoPlist;
  }
  infoPlist.CFBundleURLTypes = infoPlist.CFBundleURLTypes.map(bundleUrlType => {
    const index = bundleUrlType.CFBundleURLSchemes.indexOf(scheme);
    if (index > -1) {
      bundleUrlType.CFBundleURLSchemes.splice(index, 1);
      if (bundleUrlType.CFBundleURLSchemes.length === 0) {
        return undefined;
      }
    }
    return bundleUrlType;
  }).filter(Boolean);
  return infoPlist;
}
function hasScheme(scheme, infoPlist) {
  const existingSchemes = infoPlist.CFBundleURLTypes;
  if (!Array.isArray(existingSchemes)) return false;
  return existingSchemes?.some(({
    CFBundleURLSchemes: schemes
  }) => Array.isArray(schemes) ? schemes.includes(scheme) : false);
}
function getSchemesFromPlist(infoPlist) {
  if (Array.isArray(infoPlist.CFBundleURLTypes)) {
    return infoPlist.CFBundleURLTypes.reduce((schemes, {
      CFBundleURLSchemes
    }) => {
      if (Array.isArray(CFBundleURLSchemes)) {
        return [...schemes, ...CFBundleURLSchemes];
      }
      return schemes;
    }, []);
  }
  return [];
}
//# sourceMappingURL=Scheme.js.map