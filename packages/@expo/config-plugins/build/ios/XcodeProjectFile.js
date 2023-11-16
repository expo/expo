"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuildSourceFile = exports.withBuildSourceFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
/**
 * Create a build source file and link it to Xcode.
 *
 * @param config
 * @param props.filePath relative to the build source folder. ex: `ViewController.swift` would be created in `ios/myapp/ViewController.swift`.
 * @param props.contents file contents to write.
 * @param props.overwrite should the contents overwrite any existing file in the same location on disk.
 * @returns
 */
const withBuildSourceFile = (config, { filePath, contents, overwrite }) => {
    return (0, ios_plugins_1.withXcodeProject)(config, (config) => {
        const projectName = (0, Xcodeproj_1.getProjectName)(config.modRequest.projectRoot);
        config.modResults = createBuildSourceFile({
            project: config.modResults,
            nativeProjectRoot: config.modRequest.platformProjectRoot,
            fileContents: contents,
            filePath: path_1.default.join(projectName, filePath),
            overwrite,
        });
        return config;
    });
};
exports.withBuildSourceFile = withBuildSourceFile;
/**
 * Add a source file to the Xcode project and write it to the file system.
 *
 * @param nativeProjectRoot absolute path to the native app root `user/app/ios`
 * @param filePath path relative to the `nativeProjectRoot` for the file to create `user/app/ios/myapp/foobar.swift`
 * @param fileContents string file contents to write to the `filePath`
 * @param overwrite should write file even if one already exists
 */
function createBuildSourceFile({ project, nativeProjectRoot, filePath, fileContents, overwrite, }) {
    const absoluteFilePath = path_1.default.join(nativeProjectRoot, filePath);
    if (overwrite || !fs_1.default.existsSync(absoluteFilePath)) {
        // Create the file
        fs_1.default.writeFileSync(absoluteFilePath, fileContents, 'utf8');
    }
    // `myapp`
    const groupName = path_1.default.dirname(filePath);
    // Ensure the file is linked with Xcode resource files
    if (!project.hasFile(filePath)) {
        project = (0, Xcodeproj_1.addBuildSourceFileToGroup)({
            filepath: filePath,
            groupName,
            project,
        });
    }
    return project;
}
exports.createBuildSourceFile = createBuildSourceFile;
