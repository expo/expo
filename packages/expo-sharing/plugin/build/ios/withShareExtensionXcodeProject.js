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
exports.withShareExtensionXcodeProject = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const console = __importStar(require("node:console"));
const conflictingExtensionExists_1 = require("./conflictingExtensionExists");
const addBuildPhases_1 = require("./xcode/addBuildPhases");
const addPbxGroup_1 = require("./xcode/addPbxGroup");
const addProductFile_1 = require("./xcode/addProductFile");
const addToPbxNativeTargetSection_1 = require("./xcode/addToPbxNativeTargetSection");
const addToPbxProjectSection_1 = require("./xcode/addToPbxProjectSection");
const addXCConfigurationList_1 = require("./xcode/addXCConfigurationList");
const withShareExtensionXcodeProject = (config, { targetName, bundleIdentifier, deploymentTarget, shareExtensionFiles }) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const groupName = 'Embed Foundation Extensions';
        const xcodeProject = config.modResults;
        const { platformProjectRoot } = config.modRequest;
        const targetUuid = xcodeProject.generateUuid();
        // Technically we should be able to remove the existing target, but I don't have time to add it before the release.
        // Most users will chose not to modify the identifier anyways.
        // TODO: Add smart existing target removal
        const conflict_status = (0, conflictingExtensionExists_1.conflictingExtensionExists)(xcodeProject, targetName, bundleIdentifier);
        if (conflict_status === 'exists-conflicting') {
            throw new Error(`Expo-sharing: An extension with the name ${targetName} already exists in the project, but is registered with a different bundle identifier.` +
                ` The existing extension will not be modified. In order to apply a new bundle identifier run the prebuild command with \`--clean\` flag`);
        }
        if (conflict_status === 'exists') {
            console.warn(`Expo-sharing: Target with bundleId: ${bundleIdentifier} already exists in the project and will not be added`);
            return config;
        }
        const xcConfigurationList = (0, addXCConfigurationList_1.addXCConfigurationList)(xcodeProject, targetName, bundleIdentifier, deploymentTarget, config.ios?.buildNumber ?? '1', config.version ?? '1.0');
        const productFile = (0, addProductFile_1.addProductFile)(xcodeProject, targetName, groupName);
        const pbxNativeTargetObject = (0, addToPbxNativeTargetSection_1.addToPbxNativeTargetSection)(xcodeProject, targetName, targetUuid, productFile, xcConfigurationList);
        (0, addToPbxProjectSection_1.addToPbxProjectSection)(xcodeProject, pbxNativeTargetObject);
        (0, addBuildPhases_1.addBuildPhases)(xcodeProject, targetUuid, targetName, groupName, productFile, shareExtensionFiles, platformProjectRoot);
        (0, addPbxGroup_1.addPbxGroup)(xcodeProject, targetName, shareExtensionFiles, platformProjectRoot);
        return config;
    });
};
exports.withShareExtensionXcodeProject = withShareExtensionXcodeProject;
