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
const config_plugins_1 = require("expo/config-plugins");
const path = __importStar(require("path"));
const addBuildPhases_1 = require("./addBuildPhases");
const addPbxGroup_1 = require("./addPbxGroup");
const addProductFile_1 = require("./addProductFile");
const addTargetDependency_1 = require("./addTargetDependency");
const addToPbxNativeTargetSection_1 = require("./addToPbxNativeTargetSection");
const addToPbxProjectSection_1 = require("./addToPbxProjectSection");
const addXCConfigurationList_1 = require("./addXCConfigurationList");
const withTargetXcodeProject = (config, { targetName, bundleIdentifier, deploymentTarget, appleTeamId, getFileUris }) => (0, config_plugins_1.withXcodeProject)(config, (config) => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.generateUuid();
    const groupName = 'Embed Foundation Extensions';
    const xCConfigurationList = (0, addXCConfigurationList_1.addXCConfigurationList)(xcodeProject, {
        targetName,
        bundleIdentifier,
        deploymentTarget,
        appleTeamId,
        marketingVersion: '1.0',
        currentProjectVersion: '1',
    });
    const productFile = (0, addProductFile_1.addProductFile)(xcodeProject, {
        targetName,
        groupName,
    });
    const target = (0, addToPbxNativeTargetSection_1.addToPbxNativeTargetSection)(xcodeProject, {
        targetName,
        targetUuid,
        productFile,
        xCConfigurationList,
    });
    (0, addToPbxProjectSection_1.addToPbxProjectSection)(xcodeProject, target);
    (0, addTargetDependency_1.addTargetDependency)(xcodeProject, target);
    const projectRoot = config.modRequest.platformProjectRoot;
    const targetDirectory = path.join(projectRoot, targetName);
    const relativePaths = getFileUris().map((file) => path.relative(targetDirectory, file));
    const swiftWidgetFiles = relativePaths.filter((file) => file.endsWith('.swift'));
    (0, addBuildPhases_1.addBuildPhases)(xcodeProject, {
        targetUuid: target.uuid,
        groupName,
        productFile,
        widgetFiles: swiftWidgetFiles,
    });
    (0, addPbxGroup_1.addPbxGroup)(xcodeProject, {
        targetName,
        widgetFiles: relativePaths,
    });
    return config;
});
exports.default = withTargetXcodeProject;
