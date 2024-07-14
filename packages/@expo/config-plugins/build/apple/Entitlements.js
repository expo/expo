"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withAssociatedDomains = exports.setAssociatedDomains = exports.getEntitlementsPath = exports.ensureApplicationTargetEntitlementsFileConfigured = void 0;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _slash() {
  const data = _interopRequireDefault(require("slash"));
  _slash = function () {
    return data;
  };
  return data;
}
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
function _string() {
  const data = require("./utils/string");
  _string = function () {
    return data;
  };
  return data;
}
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const withAssociatedDomains = applePlatform => (0, _applePlugins().createEntitlementsPlugin)(applePlatform)((config, jsonObject) => setAssociatedDomains(applePlatform)(config, jsonObject), 'withAssociatedDomains');
exports.withAssociatedDomains = withAssociatedDomains;
const setAssociatedDomains = applePlatform => (config, {
  'com.apple.developer.associated-domains': _,
  ...entitlementsPlist
}) => {
  if (config[applePlatform]?.associatedDomains) {
    return {
      ...entitlementsPlist,
      'com.apple.developer.associated-domains': config[applePlatform].associatedDomains
    };
  }
  return entitlementsPlist;
};
exports.setAssociatedDomains = setAssociatedDomains;
const getEntitlementsPath = applePlatform => (projectRoot, {
  targetName,
  buildConfiguration = 'Release'
} = {}) => {
  const project = (0, _Xcodeproj().getPbxproj)(applePlatform)(projectRoot);
  const xcBuildConfiguration = (0, _Target().getXCBuildConfigurationFromPbxproj)(project, {
    targetName,
    buildConfiguration
  });
  if (!xcBuildConfiguration) {
    return null;
  }
  const entitlementsPath = getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration);
  return entitlementsPath && _fs().default.existsSync(entitlementsPath) ? entitlementsPath : null;
};
exports.getEntitlementsPath = getEntitlementsPath;
function getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration) {
  const entitlementsPathRaw = xcBuildConfiguration?.buildSettings?.CODE_SIGN_ENTITLEMENTS;
  if (entitlementsPathRaw) {
    return _path().default.normalize(_path().default.join(projectRoot, 'ios', (0, _string().trimQuotes)(entitlementsPathRaw)));
  } else {
    return null;
  }
}
const ensureApplicationTargetEntitlementsFileConfigured = applePlatform => projectRoot => {
  const project = (0, _Xcodeproj().getPbxproj)(applePlatform)(projectRoot);
  const projectName = (0, _Xcodeproj().getProjectName)(applePlatform)(projectRoot);
  const productName = (0, _Xcodeproj().getProductName)(project);
  const [, applicationTarget] = (0, _Target().findFirstNativeTarget)(project);
  const buildConfigurations = (0, _Xcodeproj().getBuildConfigurationsForListId)(project, applicationTarget.buildConfigurationList);
  let hasChangesToWrite = false;
  for (const [, xcBuildConfiguration] of buildConfigurations) {
    const oldEntitlementPath = getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration);
    if (oldEntitlementPath && _fs().default.existsSync(oldEntitlementPath)) {
      return;
    }
    hasChangesToWrite = true;
    // Use posix formatted path, even on Windows
    const entitlementsRelativePath = (0, _slash().default)(_path().default.join(projectName, `${productName}.entitlements`));
    const entitlementsPath = _path().default.normalize(_path().default.join(projectRoot, 'ios', entitlementsRelativePath));
    _fs().default.mkdirSync(_path().default.dirname(entitlementsPath), {
      recursive: true
    });
    if (!_fs().default.existsSync(entitlementsPath)) {
      _fs().default.writeFileSync(entitlementsPath, ENTITLEMENTS_TEMPLATE);
    }
    xcBuildConfiguration.buildSettings.CODE_SIGN_ENTITLEMENTS = entitlementsRelativePath;
  }
  if (hasChangesToWrite) {
    _fs().default.writeFileSync(project.filepath, project.writeSync());
  }
};
exports.ensureApplicationTargetEntitlementsFileConfigured = ensureApplicationTargetEntitlementsFileConfigured;
const ENTITLEMENTS_TEMPLATE = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
`;
//# sourceMappingURL=Entitlements.js.map