"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureSwiftBridgingHeaderSetup = exports.createBridgingHeaderFile = void 0;
exports.getDesignatedSwiftBridgingHeaderFileReference = getDesignatedSwiftBridgingHeaderFileReference;
exports.linkBridgingHeaderFile = linkBridgingHeaderFile;
exports.withSwiftBridgingHeader = exports.withNoopSwiftFile = void 0;
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
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
    return data;
  };
  return data;
}
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
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
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const templateBridgingHeader = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//
`;

/**
 * Ensure a Swift bridging header is created for the project.
 * This helps fix problems related to using modules that are written in Swift (lottie, FBSDK).
 *
 * 1. Ensures the file exists given the project path.
 * 2. Writes the file and links to Xcode as a resource file.
 * 3. Sets the build configuration `SWIFT_OBJC_BRIDGING_HEADER = [PROJECT_NAME]-Bridging-Header.h`
 */
const withSwiftBridgingHeader = applePlatform => config => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, config => {
    config.modResults = ensureSwiftBridgingHeaderSetup(applePlatform)({
      project: config.modResults,
      projectRoot: config.modRequest.projectRoot
    });
    return config;
  });
};
exports.withSwiftBridgingHeader = withSwiftBridgingHeader;
const ensureSwiftBridgingHeaderSetup = applePlatform => ({
  projectRoot,
  project
}) => {
  // Only create a bridging header if using objective-c
  if (shouldCreateSwiftBridgingHeader(applePlatform)({
    projectRoot,
    project
  })) {
    const projectName = (0, _Xcodeproj().getProjectName)(applePlatform)(projectRoot);
    const bridgingHeader = createBridgingHeaderFileName(projectName);
    // Ensure a bridging header is created in the Xcode project.
    project = createBridgingHeaderFile(applePlatform)({
      project,
      projectName,
      projectRoot,
      bridgingHeader
    });
    // Designate the newly created file as the Swift bridging header in the Xcode project.
    project = linkBridgingHeaderFile({
      project,
      bridgingHeader: _path().default.join(projectName, bridgingHeader)
    });
  }
  return project;
};
exports.ensureSwiftBridgingHeaderSetup = ensureSwiftBridgingHeaderSetup;
const shouldCreateSwiftBridgingHeader = applePlatform => ({
  projectRoot,
  project
}) => {
  // Only create a bridging header if the project is using in Objective C (AppDelegate is written in Objc).
  const isObjc = (0, _Paths().getAppDelegate)(applePlatform)(projectRoot).language !== 'swift';
  return isObjc && !getDesignatedSwiftBridgingHeaderFileReference({
    project
  });
};

/**
 * @returns String matching the default name used when Xcode automatically creates a bridging header file.
 */
function createBridgingHeaderFileName(projectName) {
  return `${projectName}-Bridging-Header.h`;
}
function getDesignatedSwiftBridgingHeaderFileReference({
  project
}) {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const {
    buildSettings
  } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      if (typeof buildSettings.SWIFT_OBJC_BRIDGING_HEADER === 'string' && buildSettings.SWIFT_OBJC_BRIDGING_HEADER) {
        return buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
      }
    }
  }
  return null;
}

/**
 *
 * @param bridgingHeader The bridging header filename ex: `ExpoAPIs-Bridging-Header.h`
 * @returns
 */
function linkBridgingHeaderFile({
  project,
  bridgingHeader
}) {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const {
    buildSettings
  } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      buildSettings.SWIFT_OBJC_BRIDGING_HEADER = bridgingHeader;
    }
  }
  return project;
}
const createBridgingHeaderFile = applePlatform => ({
  projectRoot,
  projectName,
  project,
  bridgingHeader
}) => {
  const bridgingHeaderProjectPath = _path().default.join((0, _Paths().getSourceRoot)(applePlatform)(projectRoot), bridgingHeader);
  if (!_fs().default.existsSync(bridgingHeaderProjectPath)) {
    // Create the file
    _fs().default.writeFileSync(bridgingHeaderProjectPath, templateBridgingHeader, 'utf8');
  }

  // This is non-standard, Xcode generates the bridging header in `/ios` (or `/macos`) which is kinda annoying.
  // Instead, this'll generate the default header in the application code folder `/ios/myproject/` (or `/macos/myproject/`).
  const filePath = `${projectName}/${bridgingHeader}`;
  // Ensure the file is linked with Xcode resource files
  if (!project.hasFile(filePath)) {
    project = (0, _Xcodeproj().addResourceFileToGroup)(applePlatform)({
      filepath: filePath,
      groupName: projectName,
      project,
      // Not sure why, but this is how Xcode generates it.
      isBuildFile: false,
      verbose: false
    });
  }
  return project;
};
exports.createBridgingHeaderFile = createBridgingHeaderFile;
const withNoopSwiftFile = applePlatform => config => {
  return (0, _XcodeProjectFile().withBuildSourceFile)(applePlatform)(config, {
    filePath: 'noop-file.swift',
    contents: ['//', '// @generated', '// A blank Swift file must be created for native modules with Swift files to work correctly.', '//', ''].join('\n')
  });
};
exports.withNoopSwiftFile = withNoopSwiftFile;
//# sourceMappingURL=Swift.js.map