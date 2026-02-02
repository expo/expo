"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBuildPhases = addBuildPhases;
function addBuildPhases(xcodeProject, { targetUuid, groupName, productFile, widgetFiles, }) {
    const buildPath = `""`;
    const folderType = 'app_extension';
    // Sources build phase
    xcodeProject.addBuildPhase([...widgetFiles], 'PBXSourcesBuildPhase', groupName, targetUuid, folderType, buildPath);
    // Copy files build phase
    xcodeProject.addBuildPhase([], 'PBXCopyFilesBuildPhase', groupName, xcodeProject.getFirstTarget().uuid, folderType, buildPath);
    xcodeProject
        .buildPhaseObject('PBXCopyFilesBuildPhase', groupName, productFile.target)
        .files.push({
        value: productFile.uuid,
        comment: `${productFile.basename} in ${productFile.group}`,
    });
    xcodeProject.addToPbxBuildFileSection(productFile);
    // Frameworks build phase
    xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', groupName, targetUuid, folderType, buildPath);
}
