"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBuildSourceFile = createBuildSourceFile;
exports.withBuildSourceFile = void 0;
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
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
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
const withBuildSourceFile = (config, {
  filePath,
  contents,
  overwrite
}) => {
  return (0, _iosPlugins().withXcodeProject)(config, config => {
    const projectName = (0, _Xcodeproj().getProjectName)(config.modRequest.projectRoot);
    config.modResults = createBuildSourceFile({
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
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
exports.withBuildSourceFile = withBuildSourceFile;
function createBuildSourceFile({
  project,
  nativeProjectRoot,
  filePath,
  fileContents,
  overwrite
}) {
  const absoluteFilePath = _path().default.join(nativeProjectRoot, filePath);
  if (overwrite || !_fs().default.existsSync(absoluteFilePath)) {
    // Create the file
    _fs().default.writeFileSync(absoluteFilePath, fileContents, 'utf8');
  }

  // `myapp`
  const groupName = _path().default.dirname(filePath);

  // Ensure the file is linked with Xcode resource files
  if (!project.hasFile(filePath)) {
    project = (0, _Xcodeproj().addBuildSourceFileToGroup)({
      filepath: filePath,
      groupName,
      project
    });
  }
  return project;
}
//# sourceMappingURL=XcodeProjectFile.js.map