"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXCodeProject = updateXCodeProject;
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function updateXCodeProject(projectRoot) {
    const pbxProject = config_plugins_1.IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
    const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;
    const iosFolderPath = path.resolve(projectRoot, 'ios');
    const objects = pbxProject.hash.project.objects;
    const dirEntryExists = (dir) => {
        if (!objects.PBXFileSystemSynchronizedRootGroup) {
            return false;
        }
        for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
            if (key.endsWith('_comment')) {
                continue;
            }
            if (path.relative(iosFolderPath, path.resolve(projectRoot, dir)) ===
                objects.PBXFileSystemSynchronizedRootGroup[key].path) {
                return true;
            }
        }
        return false;
    };
    const swiftWatchedDirectories = (0, config_1.getConfig)(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
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
            path: path.relative(iosFolderPath, path.resolve(projectRoot, dir)),
            sourceTree: 'SOURCE_ROOT',
        };
        //@ts-ignore
        objects.PBXFileSystemSynchronizedRootGroup[newUUID + '_comment'] = dir;
        const nativeTargetGroup = objects.PBXNativeTarget[mainTargetUUID];
        if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
            nativeTargetGroup.fileSystemSynchronizedGroups = [];
        }
        nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: dir });
    }
    await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
