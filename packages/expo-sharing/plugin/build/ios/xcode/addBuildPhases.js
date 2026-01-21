"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBuildPhases = addBuildPhases;
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../utils");
function addBuildPhases(xcodeProject, targetUuid, targetName, groupName, productFile, shareExtensionFiles, platformProjectRoot) {
    const buildPath = `""`;
    const sharedFilesPath = (0, utils_1.getSharedFilesPath)();
    const folderType = 'app_extension';
    const { swiftFiles, intentFiles, assetDirectories, sharedFiles } = shareExtensionFiles;
    // Gets the location of the shared files relative to the extension directory
    const sharedSwiftFiles = sharedFiles?.swiftFiles
        .map((file) => path_1.default.join(sharedFilesPath, file))
        .map((file) => {
        const shareExtensionDirectory = path_1.default.join(platformProjectRoot, targetName, 'shared');
        return path_1.default.relative(shareExtensionDirectory, file);
    }) || [];
    xcodeProject.addBuildPhase([...swiftFiles, ...intentFiles, ...sharedSwiftFiles], 'PBXSourcesBuildPhase', groupName, targetUuid, folderType, buildPath);
    xcodeProject.addBuildPhase([], 'PBXCopyFilesBuildPhase', groupName, xcodeProject.getFirstTarget().uuid, folderType, buildPath);
    xcodeProject
        .buildPhaseObject('PBXCopyFilesBuildPhase', groupName, productFile.target)
        .files.push({
        value: productFile.uuid,
        comment: `${productFile.basename} in ${productFile.group}`,
    });
    xcodeProject.addToPbxBuildFileSection(productFile);
    xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', groupName, targetUuid, folderType, buildPath);
    xcodeProject.addBuildPhase([...assetDirectories], 'PBXResourcesBuildPhase', groupName, targetUuid, folderType, buildPath);
}
