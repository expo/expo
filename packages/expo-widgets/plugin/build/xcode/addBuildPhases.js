"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBuildPhases = addBuildPhases;
function addBuildPhases(xcodeProject, { targetUuid, groupName, productFile, widgetFiles, }) {
    const buildPath = `""`;
    const folderType = 'app_extension';
    const mainTargetUuid = xcodeProject.getFirstTarget().uuid;
    // Sources build phase
    if (!getBuildPhaseObject(xcodeProject, 'PBXSourcesBuildPhase', targetUuid)) {
        xcodeProject.addBuildPhase([...widgetFiles], 'PBXSourcesBuildPhase', 'Sources', targetUuid, folderType, buildPath);
    }
    // Copy files build phase
    if (!getBuildPhaseObject(xcodeProject, 'PBXCopyFilesBuildPhase', mainTargetUuid, groupName)) {
        xcodeProject.addBuildPhase([], 'PBXCopyFilesBuildPhase', groupName, mainTargetUuid, folderType, buildPath);
    }
    const copyFilesBuildPhase = getBuildPhaseObject(xcodeProject, 'PBXCopyFilesBuildPhase', mainTargetUuid, groupName);
    if (copyFilesBuildPhase &&
        !copyFilesBuildPhase.files.some((file) => file.value === productFile.uuid)) {
        copyFilesBuildPhase.files.push({
            value: productFile.uuid,
            comment: `${productFile.basename} in ${productFile.group}`,
        });
    }
    if (!xcodeProject.pbxBuildFileSection()[productFile.uuid]) {
        xcodeProject.addToPbxBuildFileSection(productFile);
    }
    // Frameworks build phase
    if (!getBuildPhaseObject(xcodeProject, 'PBXFrameworksBuildPhase', targetUuid)) {
        xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', targetUuid, folderType, buildPath);
    }
}
function getBuildPhaseObject(xcodeProject, buildPhaseType, targetUuid, comment) {
    const buildPhaseSection = xcodeProject.hash.project.objects[buildPhaseType];
    const target = xcodeProject.pbxNativeTargetSection()[targetUuid];
    if (!buildPhaseSection || !target?.buildPhases) {
        return null;
    }
    const buildPhase = target.buildPhases.find((buildPhase) => (!comment || buildPhase.comment === comment) && buildPhaseSection[buildPhase.value]);
    return buildPhase ? buildPhaseSection[buildPhase.value] : null;
}
