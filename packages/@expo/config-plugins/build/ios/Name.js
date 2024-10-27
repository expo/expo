"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getName = getName;
exports.setDisplayName = setDisplayName;
exports.setName = setName;
exports.setProductName = setProductName;
exports.withProductName = exports.withName = exports.withDisplayName = void 0;
function _Target() {
  const data = require("./Target");
  _Target = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
const withDisplayName = exports.withDisplayName = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setDisplayName, {
  infoPlistProperty: 'CFBundleDisplayName',
  expoConfigProperty: 'name'
}, 'withDisplayName');
const withName = exports.withName = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setName, {
  infoPlistProperty: 'CFBundleName',
  expoConfigProperty: 'name'
}, 'withName');

/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
const withProductName = config => {
  return (0, _iosPlugins().withXcodeProject)(config, config => {
    config.modResults = setProductName(config, config.modResults);
    return config;
  });
};
exports.withProductName = withProductName;
function getName(config) {
  return typeof config.name === 'string' ? config.name : null;
}

/**
 * CFBundleDisplayName is used for most things: the name on the home screen, in
 * notifications, and others.
 */
function setDisplayName(configOrName, {
  CFBundleDisplayName,
  ...infoPlist
}) {
  let name = null;
  if (typeof configOrName === 'string') {
    name = configOrName;
  } else {
    name = getName(configOrName);
  }
  if (!name) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    CFBundleDisplayName: name
  };
}

/**
 * CFBundleName is recommended to be 16 chars or less and is used in lists, eg:
 * sometimes on the App Store
 */
function setName(config, {
  CFBundleName,
  ...infoPlist
}) {
  const name = getName(config);
  if (!name) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    CFBundleName: name
  };
}
function setProductName(config, project) {
  const name = (0, _Xcodeproj().sanitizedName)(getName(config) ?? '');
  if (!name) {
    return project;
  }
  const quotedName = ensureQuotes(name);
  const [, nativeTarget] = (0, _Target().findFirstNativeTarget)(project);
  (0, _Xcodeproj().getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).forEach(([, item]) => {
    item.buildSettings.PRODUCT_NAME = quotedName;
  });
  return project;
}
const ensureQuotes = value => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`;
  }
  return value;
};
//# sourceMappingURL=Name.js.map