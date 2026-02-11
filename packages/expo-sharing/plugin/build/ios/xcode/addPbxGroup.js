"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPbxGroup = addPbxGroup;
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../utils");
function addPbxGroup(xcodeProject, targetName, shareExtensionFiles, platformProjectRoot) {
    const sharedFilesPath = (0, utils_1.getSharedFilesPath)();
    const targetFiles = Object.values({
        ...shareExtensionFiles,
        sharedFiles: [],
    }).flat();
    // Add generated files
    targetFiles.push(`${targetName}.entitlements`);
    targetFiles.push(`Info.plist`);
    const sharedFiles = Object.values(shareExtensionFiles.sharedFiles ?? [])
        .flat()
        .map((file) => path_1.default.join(sharedFilesPath, file))
        .map((file) => path_1.default.relative(path_1.default.join(platformProjectRoot, targetName, 'shared'), file));
    const { uuid: mainGroupUuid } = xcodeProject.addPbxGroup(targetFiles, targetName, targetName);
    const { uuid: sharedGroupUuid } = xcodeProject.addPbxGroup(sharedFiles, 'shared', 'shared');
    if (mainGroupUuid && sharedGroupUuid) {
        xcodeProject.addToPbxGroup(sharedGroupUuid, mainGroupUuid);
    }
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    if (mainGroupUuid) {
        Object.keys(groups).forEach((key) => {
            if (!groups[key].name && !groups[key].path) {
                xcodeProject.addToPbxGroup(mainGroupUuid, key);
            }
        });
    }
}
