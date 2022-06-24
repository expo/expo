"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getApplicationTargetNameForSchemeAsync = getApplicationTargetNameForSchemeAsync;
exports.getArchiveBuildConfigurationForSchemeAsync = getArchiveBuildConfigurationForSchemeAsync;
exports.getRunnableSchemesFromXcodeproj = getRunnableSchemesFromXcodeproj;
exports.getSchemesFromXcodeproj = getSchemesFromXcodeproj;

function _XML() {
  const data = require("../utils/XML");

  _XML = function () {
    return data;
  };

  return data;
}

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

function getSchemesFromXcodeproj(projectRoot) {
  return (0, _Paths().findSchemeNames)(projectRoot);
}

function getRunnableSchemesFromXcodeproj(projectRoot, {
  configuration = 'Debug'
} = {}) {
  const project = (0, _Xcodeproj().getPbxproj)(projectRoot);
  return (0, _Target().findSignableTargets)(project).map(([, target]) => {
    let osType = 'iOS';
    const type = (0, _Xcodeproj().unquote)(target.productType);

    if (type === _Target().TargetType.WATCH) {
      osType = 'watchOS';
    } else if ( // (apps) com.apple.product-type.application
    // (app clips) com.apple.product-type.application.on-demand-install-capable
    // NOTE(EvanBacon): This matches against `watchOS` as well so we check for watch first.
    type.startsWith(_Target().TargetType.APPLICATION)) {
      // Attempt to resolve the platform SDK for each target so we can filter devices.
      const xcConfigurationList = project.hash.project.objects.XCConfigurationList[target.buildConfigurationList];

      if (xcConfigurationList) {
        const buildConfiguration = xcConfigurationList.buildConfigurations.find(value => value.comment === configuration) || xcConfigurationList.buildConfigurations[0];

        if (buildConfiguration !== null && buildConfiguration !== void 0 && buildConfiguration.value) {
          var _project$hash$project;

          const xcBuildConfiguration = (_project$hash$project = project.hash.project.objects.XCBuildConfiguration) === null || _project$hash$project === void 0 ? void 0 : _project$hash$project[buildConfiguration.value];
          const buildSdkRoot = xcBuildConfiguration.buildSettings.SDKROOT;

          if (buildSdkRoot === 'appletvos' || 'TVOS_DEPLOYMENT_TARGET' in xcBuildConfiguration.buildSettings) {
            // Is a TV app...
            osType = 'tvOS';
          } else if (buildSdkRoot === 'iphoneos') {
            osType = 'iOS';
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
}

async function readSchemeAsync(projectRoot, scheme) {
  const allSchemePaths = (0, _Paths().findSchemePaths)(projectRoot);
  const re = new RegExp(`/${scheme}.xcscheme`, 'i');
  const schemePath = allSchemePaths.find(i => re.exec(i));

  if (schemePath) {
    return await (0, _XML().readXMLAsync)({
      path: schemePath
    });
  } else {
    throw new Error(`scheme '${scheme}' does not exist, make sure it's marked as shared`);
  }
}

async function getApplicationTargetNameForSchemeAsync(projectRoot, scheme) {
  var _schemeXML$Scheme, _schemeXML$Scheme$Bui, _schemeXML$Scheme$Bui2, _schemeXML$Scheme$Bui3, _schemeXML$Scheme$Bui4;

  const schemeXML = await readSchemeAsync(projectRoot, scheme);
  const buildActionEntry = schemeXML === null || schemeXML === void 0 ? void 0 : (_schemeXML$Scheme = schemeXML.Scheme) === null || _schemeXML$Scheme === void 0 ? void 0 : (_schemeXML$Scheme$Bui = _schemeXML$Scheme.BuildAction) === null || _schemeXML$Scheme$Bui === void 0 ? void 0 : (_schemeXML$Scheme$Bui2 = _schemeXML$Scheme$Bui[0]) === null || _schemeXML$Scheme$Bui2 === void 0 ? void 0 : (_schemeXML$Scheme$Bui3 = _schemeXML$Scheme$Bui2.BuildActionEntries) === null || _schemeXML$Scheme$Bui3 === void 0 ? void 0 : (_schemeXML$Scheme$Bui4 = _schemeXML$Scheme$Bui3[0]) === null || _schemeXML$Scheme$Bui4 === void 0 ? void 0 : _schemeXML$Scheme$Bui4.BuildActionEntry;
  const targetName = (buildActionEntry === null || buildActionEntry === void 0 ? void 0 : buildActionEntry.length) === 1 ? getBlueprintName(buildActionEntry[0]) : getBlueprintName(buildActionEntry === null || buildActionEntry === void 0 ? void 0 : buildActionEntry.find(entry => {
    var _entry$BuildableRefer, _entry$BuildableRefer2, _entry$BuildableRefer3, _entry$BuildableRefer4;

    return (_entry$BuildableRefer = entry.BuildableReference) === null || _entry$BuildableRefer === void 0 ? void 0 : (_entry$BuildableRefer2 = _entry$BuildableRefer[0]) === null || _entry$BuildableRefer2 === void 0 ? void 0 : (_entry$BuildableRefer3 = _entry$BuildableRefer2['$']) === null || _entry$BuildableRefer3 === void 0 ? void 0 : (_entry$BuildableRefer4 = _entry$BuildableRefer3.BuildableName) === null || _entry$BuildableRefer4 === void 0 ? void 0 : _entry$BuildableRefer4.endsWith('.app');
  }));

  if (!targetName) {
    throw new Error(`${scheme}.xcscheme seems to be corrupted`);
  }

  return targetName;
}

async function getArchiveBuildConfigurationForSchemeAsync(projectRoot, scheme) {
  var _schemeXML$Scheme2, _schemeXML$Scheme2$Ar, _schemeXML$Scheme2$Ar2, _schemeXML$Scheme2$Ar3;

  const schemeXML = await readSchemeAsync(projectRoot, scheme);
  const buildConfiguration = schemeXML === null || schemeXML === void 0 ? void 0 : (_schemeXML$Scheme2 = schemeXML.Scheme) === null || _schemeXML$Scheme2 === void 0 ? void 0 : (_schemeXML$Scheme2$Ar = _schemeXML$Scheme2.ArchiveAction) === null || _schemeXML$Scheme2$Ar === void 0 ? void 0 : (_schemeXML$Scheme2$Ar2 = _schemeXML$Scheme2$Ar[0]) === null || _schemeXML$Scheme2$Ar2 === void 0 ? void 0 : (_schemeXML$Scheme2$Ar3 = _schemeXML$Scheme2$Ar2['$']) === null || _schemeXML$Scheme2$Ar3 === void 0 ? void 0 : _schemeXML$Scheme2$Ar3.buildConfiguration;

  if (!buildConfiguration) {
    throw new Error(`${scheme}.xcscheme seems to be corrupted`);
  }

  return buildConfiguration;
}

function getBlueprintName(entry) {
  var _entry$BuildableRefer5, _entry$BuildableRefer6, _entry$BuildableRefer7;

  return entry === null || entry === void 0 ? void 0 : (_entry$BuildableRefer5 = entry.BuildableReference) === null || _entry$BuildableRefer5 === void 0 ? void 0 : (_entry$BuildableRefer6 = _entry$BuildableRefer5[0]) === null || _entry$BuildableRefer6 === void 0 ? void 0 : (_entry$BuildableRefer7 = _entry$BuildableRefer6['$']) === null || _entry$BuildableRefer7 === void 0 ? void 0 : _entry$BuildableRefer7.BlueprintName;
}
//# sourceMappingURL=BuildScheme.js.map