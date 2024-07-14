"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSchemesFromXcodeproj = exports.getRunnableSchemesFromXcodeproj = exports.getArchiveBuildConfigurationForSchemeAsync = exports.getApplicationTargetNameForSchemeAsync = void 0;
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
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
function _XML() {
  const data = require("../utils/XML");
  _XML = function () {
    return data;
  };
  return data;
}
const getSchemesFromXcodeproj = applePlatform => projectRoot => (0, _Paths().findSchemeNames)(applePlatform)(projectRoot);
exports.getSchemesFromXcodeproj = getSchemesFromXcodeproj;
const getRunnableSchemesFromXcodeproj = applePlatform => (projectRoot, {
  configuration = 'Debug'
} = {}) => {
  const project = (0, _Xcodeproj().getPbxproj)(applePlatform)(projectRoot);
  return (0, _Target().findSignableTargets)(project).map(([, target]) => {
    let osType = applePlatform === 'ios' ? 'iOS' : 'macOS';
    const type = (0, _Xcodeproj().unquote)(target.productType);
    if (type === _Target().TargetType.WATCH) {
      osType = 'watchOS';
    } else if (
    // (apps) com.apple.product-type.application
    // (app clips) com.apple.product-type.application.on-demand-install-capable
    // NOTE(EvanBacon): This matches against `watchOS` as well so we check for watch first.
    type.startsWith(_Target().TargetType.APPLICATION)) {
      // Attempt to resolve the platform SDK for each target so we can filter devices.
      const xcConfigurationList = project.hash.project.objects.XCConfigurationList[target.buildConfigurationList];
      if (xcConfigurationList) {
        const buildConfiguration = xcConfigurationList.buildConfigurations.find(value => value.comment === configuration) || xcConfigurationList.buildConfigurations[0];
        if (buildConfiguration?.value) {
          const xcBuildConfiguration = project.hash.project.objects.XCBuildConfiguration?.[buildConfiguration.value];
          const buildSdkRoot = xcBuildConfiguration.buildSettings.SDKROOT;
          if (buildSdkRoot === 'appletvos' || 'TVOS_DEPLOYMENT_TARGET' in xcBuildConfiguration.buildSettings) {
            // Is a TV app...
            osType = 'tvOS';
          } else if (buildSdkRoot === 'iphoneos') {
            osType = 'iOS';
          } else if (buildSdkRoot === 'macosx') {
            osType = 'macOS';
          }
        }
      }
    }
    return {
      name: (0, _Xcodeproj().unquote)(target.name),
      osType,
      type: (0, _Xcodeproj().unquote)(target.productType)
    };
  });
};
exports.getRunnableSchemesFromXcodeproj = getRunnableSchemesFromXcodeproj;
const readSchemeAsync = applePlatform => async (projectRoot, scheme) => {
  const allSchemePaths = (0, _Paths().findSchemePaths)(applePlatform)(projectRoot);
  const re = new RegExp(`/${scheme}.xcscheme`, 'i');
  const schemePath = allSchemePaths.find(i => re.exec(i));
  if (schemePath) {
    return await (0, _XML().readXMLAsync)({
      path: schemePath
    });
  } else {
    throw new Error(`scheme '${scheme}' does not exist, make sure it's marked as shared`);
  }
};
const getApplicationTargetNameForSchemeAsync = applePlatform => async (projectRoot, scheme) => {
  const schemeXML = await readSchemeAsync(applePlatform)(projectRoot, scheme);
  const buildActionEntry = schemeXML?.Scheme?.BuildAction?.[0]?.BuildActionEntries?.[0]?.BuildActionEntry;
  const targetName = buildActionEntry?.length === 1 ? getBlueprintName(buildActionEntry[0]) : getBlueprintName(buildActionEntry?.find(entry => {
    return entry.BuildableReference?.[0]?.['$']?.BuildableName?.endsWith('.app');
  }));
  if (!targetName) {
    throw new Error(`${scheme}.xcscheme seems to be corrupted`);
  }
  return targetName;
};
exports.getApplicationTargetNameForSchemeAsync = getApplicationTargetNameForSchemeAsync;
const getArchiveBuildConfigurationForSchemeAsync = applePlatform => async (projectRoot, scheme) => {
  const schemeXML = await readSchemeAsync(applePlatform)(projectRoot, scheme);
  const buildConfiguration = schemeXML?.Scheme?.ArchiveAction?.[0]?.['$']?.buildConfiguration;
  if (!buildConfiguration) {
    throw new Error(`${scheme}.xcscheme seems to be corrupted`);
  }
  return buildConfiguration;
};
exports.getArchiveBuildConfigurationForSchemeAsync = getArchiveBuildConfigurationForSchemeAsync;
function getBlueprintName(entry) {
  return entry?.BuildableReference?.[0]?.['$']?.BlueprintName;
}
//# sourceMappingURL=BuildScheme.js.map