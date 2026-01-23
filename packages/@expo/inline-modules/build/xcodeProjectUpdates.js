"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXCodeProject = updateXCodeProject;
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function updateXCodeProject(projectRoot) {
    const swiftWatchedDirectories = (0, config_1.getConfig)(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
    // Only perform changes to pbxproj if necessary
    if (swiftWatchedDirectories.length === 0) {
        return;
    }
    const pbxProject = config_plugins_1.IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
    const mainTarget = pbxProject.getFirstProject().firstProject.targets[0];
    const iosFolderPath = path_1.default.resolve(projectRoot, 'ios');
    const objects = pbxProject.hash.project.objects;
    const dirEntryExists = (dir) => {
        if (!objects.PBXFileSystemSynchronizedRootGroup) {
            return false;
        }
        for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
            if (key.endsWith('_comment')) {
                continue;
            }
            if (path_1.default.relative(iosFolderPath, path_1.default.resolve(projectRoot, dir)) ===
                objects.PBXFileSystemSynchronizedRootGroup[key].path) {
                return true;
            }
        }
        return false;
    };
    for (const dir of swiftWatchedDirectories) {
        if (dirEntryExists(dir)) {
            continue;
        }
        const newUUID = pbxProject.generateUuid();
        objects.PBXGroup[mainGroupUUID].children.push({
            value: newUUID,
            comment: dir,
        });
        if (!objects.PBXFileSystemSynchronizedRootGroup) {
            objects.PBXFileSystemSynchronizedRootGroup = {};
        }
        objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
            isa: 'PBXFileSystemSynchronizedRootGroup',
            explicitFileTypes: {},
            explicitFolders: [],
            name: dir,
            path: path_1.default.relative(iosFolderPath, path_1.default.resolve(projectRoot, dir)),
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
    await fs_1.default.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
