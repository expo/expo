"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_platform_ios_1 = require("@react-native-community/cli-platform-ios");
const path_1 = __importDefault(require("path"));
const xcode_1 = require("xcode");
/**
 * Reads iOS project and locates `.pbxproj` file for further parsing and modifications.
 */
async function readPbxProject(projectRootPath) {
    const config = cli_platform_ios_1.projectConfig(projectRootPath, { plist: [] });
    if (!config) {
        throw new Error(`Couldn't find iOS project. Cannot configure iOS.`);
    }
    const { projectPath: xcodeProjPath, pbxprojPath } = config;
    // xcodeProjPath contains path to .xcodeproj directory
    if (!xcodeProjPath.endsWith('.xcodeproj')) {
        throw new Error(`Couldn't find .xcodeproj directory.`);
    }
    const projectPath = xcodeProjPath.substring(0, xcodeProjPath.length - '.xcodeproj'.length);
    const projectName = path_1.default.basename(projectPath);
    const pbxProject = new xcode_1.project(pbxprojPath);
    await new Promise(resolve => pbxProject.parse(err => {
        if (err) {
            throw new Error(`.pbxproj file parsing issue: ${err.message}.`);
        }
        resolve();
    }));
    const applicationNativeTarget = pbxProject.getTarget('com.apple.product-type.application');
    if (!applicationNativeTarget) {
        throw new Error(`Couldn't locate application PBXNativeTarget in '.xcodeproj' file.`);
    }
    if (applicationNativeTarget.target.name !== projectName) {
        throw new Error(`Application native target name mismatch. Expected ${projectName}, but found ${applicationNativeTarget.target.name}.`);
    }
    return {
        projectName,
        projectPath,
        pbxProject,
        applicationNativeTarget,
    };
}
exports.default = readPbxProject;
//# sourceMappingURL=pbxproj.js.map