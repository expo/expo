"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXcodeProject = updateXcodeProject;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
async function updateXcodeProject(projectRoot, inlineModulesXcodeParams) {
    const swiftWatchedDirectories = inlineModulesXcodeParams.watchedDirectories;
    // Only perform changes to pbxproj if necessary
    if (swiftWatchedDirectories.length === 0) {
        return;
    }
    const pbxProject = config_plugins_1.IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
    const mainTarget = pbxProject.getFirstProject().firstProject.targets[0];
    const objects = pbxProject.hash.project.objects;
    const projectRootRelativeToIos = '..';
    const fsSynchronizedRootGroups = new Set();
    if (objects.PBXFileSystemSynchronizedRootGroup) {
        for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
            if (key.endsWith('_comment')) {
                continue;
            }
            fsSynchronizedRootGroups.add(objects.PBXFileSystemSynchronizedRootGroup[key].path);
        }
    }
    else {
        objects.PBXFileSystemSynchronizedRootGroup = {};
    }
    let projectHasChanged = false;
    for (const dir of swiftWatchedDirectories) {
        const dirRelativeToIos = path_1.default.join(projectRootRelativeToIos, dir);
        if (fsSynchronizedRootGroups.has(dirRelativeToIos)) {
            continue;
        }
        projectHasChanged = true;
        const newUUID = pbxProject.generateUuid();
        objects.PBXGroup[mainGroupUUID].children.push({
            value: newUUID,
            comment: dir,
        });
        objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
            isa: 'PBXFileSystemSynchronizedRootGroup',
            explicitFileTypes: {},
            explicitFolders: [],
            name: dir,
            path: dirRelativeToIos,
            sourceTree: 'SOURCE_ROOT',
        };
        if (mainTarget) {
            const nativeTargetGroup = objects.PBXNativeTarget[mainTarget.value];
            if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
                nativeTargetGroup.fileSystemSynchronizedGroups = [];
            }
            nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: dir });
        }
    }
    if (projectHasChanged) {
        await fs_1.default.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
    }
}
