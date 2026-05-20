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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupShareExtensionFiles = setupShareExtensionFiles;
exports.parseDirectoryFiles = parseDirectoryFiles;
exports.copyFileSync = copyFileSync;
const fs_1 = __importDefault(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("../utils");
const createEntitlements_1 = require("./createEntitlements");
const createInfoPlistFile_1 = __importDefault(require("./createInfoPlistFile"));
/**
 * Copies the template files into the native project directory and prepares the extension entitlements file.
 * @returns Object storing categorized copied files.
 * Note @behenate: This doesn't support nested folders as of now, we don't need this, so I didn't bother adding it.
 */
function setupShareExtensionFiles(targetPath, extensionTargetName, appGroupId, urlScheme, activationRule) {
    const templateFilesPath = (0, utils_1.getTemplateFilesPath)('ios');
    const sharedDirectoryPath = (0, utils_1.getSharedFilesPath)();
    if (!fs_1.default.existsSync(targetPath)) {
        fs_1.default.mkdirSync(targetPath, { recursive: true });
    }
    const targetSharedPath = path.join(targetPath, 'shared');
    if (!fs_1.default.existsSync(targetSharedPath)) {
        fs_1.default.mkdirSync(targetSharedPath, { recursive: true });
    }
    (0, createEntitlements_1.createEntitlementsFile)(targetPath, extensionTargetName, appGroupId);
    (0, createInfoPlistFile_1.default)(targetPath, appGroupId, urlScheme, activationRule);
    const extensionTargetFiles = parseDirectoryFiles(templateFilesPath);
    const sharedFiles = parseDirectoryFiles(sharedDirectoryPath);
    const shareExtensionFiles = {
        ...extensionTargetFiles,
        sharedFiles,
    };
    Object.values(extensionTargetFiles)
        .flat()
        .forEach((file) => {
        const source = path.join(templateFilesPath, file);
        copyFileSync(source, targetPath);
    });
    return shareExtensionFiles;
}
function parseDirectoryFiles(directoryPath) {
    const projectFiles = {
        swiftFiles: [],
        entitlementFiles: [],
        plistFiles: [],
        assetDirectories: [],
        intentFiles: [],
        otherFiles: [],
    };
    if (fs_1.default.lstatSync(directoryPath).isDirectory()) {
        const files = fs_1.default.readdirSync(directoryPath);
        files.forEach((file) => {
            // Skip directories
            if (fs_1.default.lstatSync(path.join(directoryPath, file)).isDirectory()) {
                return;
            }
            const fileExtension = file.split('.').pop();
            switch (fileExtension) {
                case 'swift':
                    projectFiles.swiftFiles.push(file);
                    break;
                case 'entitlements':
                    projectFiles.entitlementFiles.push(file);
                    break;
                case 'plist':
                    projectFiles.plistFiles.push(file);
                    break;
                case 'xcassets':
                    projectFiles.assetDirectories.push(file);
                    break;
                case 'intentdefinition':
                    projectFiles.intentFiles.push(file);
                    break;
                default:
                    projectFiles.otherFiles.push(file);
                    break;
            }
        });
    }
    return projectFiles;
}
function copyFileSync(source, target) {
    let targetFile = target;
    if (fs_1.default.existsSync(target) && fs_1.default.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
    }
    fs_1.default.writeFileSync(targetFile, fs_1.default.readFileSync(source));
}
