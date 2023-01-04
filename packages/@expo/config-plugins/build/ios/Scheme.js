"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendScheme = appendScheme;
exports.getScheme = getScheme;
exports.getSchemesFromPlist = getSchemesFromPlist;
exports.hasScheme = hasScheme;
exports.removeScheme = removeScheme;
exports.setScheme = setScheme;
exports.withScheme = void 0;
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
const withScheme = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setScheme, {
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
function setScheme(config, infoPlist) {
  var _config$ios, _config$ios2;
  const scheme = [...getScheme(config),
  // @ts-ignore: TODO: ios.scheme is an unreleased -- harder to add to turtle v1.
  ...getScheme((_config$ios = config.ios) !== null && _config$ios !== void 0 ? _config$ios : {})];
  // Add the bundle identifier to the list of schemes for easier Google auth and parity with Turtle v1.
  if ((_config$ios2 = config.ios) !== null && _config$ios2 !== void 0 && _config$ios2.bundleIdentifier) {
    scheme.push(config.ios.bundleIdentifier);
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
}
function appendScheme(scheme, infoPlist) {
  var _infoPlist$CFBundleUR;
  if (!scheme) {
    return infoPlist;
  }
  const existingSchemes = (_infoPlist$CFBundleUR = infoPlist.CFBundleURLTypes) !== null && _infoPlist$CFBundleUR !== void 0 ? _infoPlist$CFBundleUR : [];
  if (existingSchemes !== null && existingSchemes !== void 0 && existingSchemes.some(({
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
  return existingSchemes === null || existingSchemes === void 0 ? void 0 : existingSchemes.some(({
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