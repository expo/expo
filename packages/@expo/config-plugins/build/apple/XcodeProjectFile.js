"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withBuildSourceFile = exports.createBuildSourceFile = void 0;
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
/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `ios/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
const withBuildSourceFile = applePlatform => (config, {
  filePath,
  contents,
  overwrite
}) => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, config => {
    const projectName = (0, _Xcodeproj().getProjectName)(applePlatform)(config.modRequest.projectRoot);
    config.modResults = createBuildSourceFile(applePlatform)({
      project: config.modResults,
      nativeProjectRoot: config.modRequest.platformProjectRoot,
      fileContents: contents,
      filePath: _path().default.join(projectName, filePath),
      overwrite
    });
    return config;
  });
};

/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios` or `user/app/macos`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift` or `user/app/macos/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
exports.withBuildSourceFile = withBuildSourceFile;
const createBuildSourceFile = applePlatform => ({
  project,
  nativeProjectRoot,
  filePath,
  fileContents,
  overwrite
}) => {
  const absoluteFilePath = _path().default.join(nativeProjectRoot, filePath);
  if (overwrite || !_fs().default.existsSync(absoluteFilePath)) {
    // Create the file
    _fs().default.writeFileSync(absoluteFilePath, fileContents, 'utf8');
  }

  // `myapp`
  const groupName = _path().default.dirname(filePath);

  // Ensure the file is linked with Xcode resource files
  if (!project.hasFile(filePath)) {
    project = (0, _Xcodeproj().addBuildSourceFileToGroup)(applePlatform)({
      filepath: filePath,
      groupName,
      project
    });
  }
  return project;
};
exports.createBuildSourceFile = createBuildSourceFile;
//# sourceMappingURL=XcodeProjectFile.js.map