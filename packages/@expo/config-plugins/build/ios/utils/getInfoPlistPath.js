"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfoPlistPathFromPbxproj = void 0;
const Xcodeproj_1 = require("./Xcodeproj");
const Target_1 = require("../Target");
/**
 * Find the Info.plist path linked to a specific build configuration.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
function getInfoPlistPathFromPbxproj(projectRootOrProject, { targetName, buildConfiguration = 'Release', } = {}) {
    const project = (0, Xcodeproj_1.resolvePathOrProject)(projectRootOrProject);
    if (!project) {
        return null;
    }
    const xcBuildConfiguration = (0, Target_1.getXCBuildConfigurationFromPbxproj)(project, {
        targetName,
        buildConfiguration,
    });
    if (!xcBuildConfiguration) {
        return null;
    }
    // The `INFOPLIST_FILE` is relative to the project folder, ex: app/Info.plist.
    return sanitizeInfoPlistBuildProperty(xcBuildConfiguration.buildSettings.INFOPLIST_FILE);
}
exports.getInfoPlistPathFromPbxproj = getInfoPlistPathFromPbxproj;
function sanitizeInfoPlistBuildProperty(infoPlist) {
    return infoPlist?.replace(/"/g, '').replace('$(SRCROOT)', '') ?? null;
}
