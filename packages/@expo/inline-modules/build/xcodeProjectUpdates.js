"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXcodeProject = updateXcodeProject;
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function escapeXMLCharacters(original) {
    const noAmps = original.replace('&', '&amp;');
    const noLt = noAmps.replace('<', '&lt;');
    const noGt = noLt.replace('>', '&gt;');
    const noApos = noGt.replace('"', '\\"');
    return noApos.replace("'", "\\'");
}
// Note that this main target name is based on how `@expo/cli/src/prebuild/renameTemplateAppNameAsync.ts` preprocesses the ios project template.
// It is neccesary to match the target name in the path to ExpoModulesProvider.swift for the main target as is used when generating it.
function getMainTargetName(config) {
    const name = config.name;
    const safeName = escapeXMLCharacters(name);
    return config_plugins_1.IOSConfig.XcodeUtils.sanitizedName(safeName);
}
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
    if (objects.PBXFileSystemSynchronizedRootGroup) {
        for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
            if (key.endsWith('_comment')) {
                continue;
            }
            const groupObject = objects.PBXFileSystemSynchronizedRootGroup[key];
            fsSynchronizedRootGroups.set(groupObject.path, key);
        }
    }
    else {
        objects.PBXFileSystemSynchronizedRootGroup = {};
    }
    return { fsSynchronizedRootGroups };
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
    const nativeTargetSynchronizedGroups = getNativeTargetSynchronizedGroupsMap(pbxProject);
    const addWatchedDirectoryToTarget = (targetUUID, nativeTargetGroup, dir, dirUUID) => {
        if (!nativeTargetSynchronizedGroups.has(targetUUID)) {
            nativeTargetSynchronizedGroups.set(targetUUID, new Set());
        }
        const targetSynchronizedGroups = nativeTargetSynchronizedGroups.get(targetUUID);
        if (targetSynchronizedGroups.has(dirUUID)) {
            return;
        }
        if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
            nativeTargetGroup.fileSystemSynchronizedGroups = [];
        }
        nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: dirUUID, comment: dir });
        targetSynchronizedGroups.add(dirUUID);
    };
    const { fsSynchronizedRootGroups } = prepareSynchronizedRootGroups(pbxProject);
    const getOrCreateWatchedDirectoryUUID = (dir) => {
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
    const targetsToUpdate = pbxProject
        .getFirstProject()
        .firstProject.targets.filter((target) => {
        const targetUuid = target.value;
        const targetName = pbxNativeTarget[targetUuid].name;
        if (!xcodeProjectTargets) {
            // If the xcodeProjectTargets are not provided, default to the main target
            return targetName === getMainTargetName(inlineModulesXcodeParams);
        }
        return xcodeProjectTargets.has(targetName);
    });
    for (const watchedDirectory of swiftWatchedDirectories) {
        const dirUUID = getOrCreateWatchedDirectoryUUID(watchedDirectory);
        for (const target of targetsToUpdate) {
            const nativeTargetGroup = objects.PBXNativeTarget[target.value];
            addWatchedDirectoryToTarget(target.value, nativeTargetGroup, watchedDirectory, dirUUID);
        }
    }
    await fs_1.default.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
//# sourceMappingURL=xcodeProjectUpdates.js.map