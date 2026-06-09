"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXcodeProject = updateXcodeProject;
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getNativeTargetSynchronizedGroupsMap(pbxProject) {
    const objects = pbxProject.hash.project.objects;
    const nativeTargetSynchronizedGroups = new Map();
    for (const target of pbxProject.getFirstProject().firstProject.targets) {
        const nativeTargetGroup = objects.PBXNativeTarget[target.value];
        const synchronizedGroups = new Set();
        if (nativeTargetGroup.fileSystemSynchronizedGroups) {
            for (const synchronizedGroup of nativeTargetGroup.fileSystemSynchronizedGroups) {
                synchronizedGroups.add(synchronizedGroup.value);
            }
        }
        nativeTargetSynchronizedGroups.set(target.value, synchronizedGroups);
    }
    return nativeTargetSynchronizedGroups;
}
function prepareSynchronizedRootGroups(pbxProject) {
    const objects = pbxProject.hash.project.objects;
    const fsSynchronizedRootGroups = new Map();
    const fsSynchronizedRootGroupsUUIDs = new Set();
    if (objects.PBXFileSystemSynchronizedRootGroup) {
        for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
            if (key.endsWith('_comment')) {
                continue;
            }
            const groupObject = objects.PBXFileSystemSynchronizedRootGroup[key];
            fsSynchronizedRootGroups.set(groupObject.path, key);
            fsSynchronizedRootGroupsUUIDs.add(key);
        }
    }
    else {
        objects.PBXFileSystemSynchronizedRootGroup = {};
    }
    return { fsSynchronizedRootGroups, fsSynchronizedRootGroupsUUIDs };
}
/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
async function updateXcodeProject(projectRoot, inlineModulesXcodeParams) {
    const swiftWatchedDirectories = inlineModulesXcodeParams.watchedDirectories;
    const xcodeProjectTargets = inlineModulesXcodeParams.xcodeProjectTargets
        ? new Set(inlineModulesXcodeParams.xcodeProjectTargets)
        : undefined;
    // Only perform changes to pbxproj if necessary
    if (swiftWatchedDirectories.length === 0) {
        return;
    }
    const pbxProject = config_plugins_1.IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
    const objects = pbxProject.hash.project.objects;
    const projectRootRelativeToIos = '..';
    const pbxNativeTarget = pbxProject.hash.project.objects.PBXNativeTarget;
    const { fsSynchronizedRootGroups, fsSynchronizedRootGroupsUUIDs } = prepareSynchronizedRootGroups(pbxProject);
    const nativeTargetSynchronizedGroups = getNativeTargetSynchronizedGroupsMap(pbxProject);
    const removeWatchedDirectoriesFromTarget = (nativeTargetGroup) => {
        if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
            return;
        }
        nativeTargetGroup.fileSystemSynchronizedGroups =
            nativeTargetGroup.fileSystemSynchronizedGroups.filter((group) => !fsSynchronizedRootGroupsUUIDs.has(group.value));
    };
    const addWatchedDirectoryToTarget = (targetUUID, nativeTargetGroup, dir, dirUUID) => {
        if (nativeTargetSynchronizedGroups.get(targetUUID)?.has(dirUUID)) {
            return;
        }
        if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
            nativeTargetGroup.fileSystemSynchronizedGroups = [];
        }
        nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: dirUUID, comment: dir });
    };
    const getOrCreateWatchedDirUUID = (dir) => {
        const dirRelativeToIos = path_1.default.join(projectRootRelativeToIos, dir);
        if (fsSynchronizedRootGroups.has(dirRelativeToIos)) {
            return fsSynchronizedRootGroups.get(dirRelativeToIos);
        }
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
        return newUUID;
    };
    for (const target of pbxProject.getFirstProject().firstProject.targets) {
        const targetUuid = target.value;
        const targetName = pbxNativeTarget[targetUuid].name;
        const nativeTargetGroup = objects.PBXNativeTarget[target.value];
        if (xcodeProjectTargets && !xcodeProjectTargets.has(targetName)) {
            removeWatchedDirectoriesFromTarget(nativeTargetGroup);
            continue;
        }
        for (const dir of swiftWatchedDirectories) {
            const dirUUID = getOrCreateWatchedDirUUID(dir);
            addWatchedDirectoryToTarget(target.value, nativeTargetGroup, dir, dirUUID);
        }
    }
    await fs_1.default.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
//# sourceMappingURL=xcodeProjectUpdates.js.map