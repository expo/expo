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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceXMLPathAsync = exports.getResourceFolderAsync = exports.getAndroidManifestAsync = exports.getProjectPathOrThrowAsync = exports.getAppBuildGradleAsync = exports.getAppBuildGradleFilePath = exports.getSettingsGradleAsync = exports.getSettingsGradleFilePath = exports.getProjectBuildGradleAsync = exports.getProjectBuildGradleFilePath = exports.getGradleFilePath = exports.getMainActivityAsync = exports.getMainApplicationAsync = exports.getFileInfo = exports.getProjectFilePath = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const path = __importStar(require("path"));
const errors_1 = require("../utils/errors");
const modules_1 = require("../utils/modules");
function getProjectFilePath(projectRoot, name) {
    const filePath = (0, glob_1.sync)(path.join(projectRoot, `android/app/src/main/java/**/${name}.@(java|kt)`))[0];
    (0, assert_1.default)(filePath, `Project file "${name}" does not exist in android project for root "${projectRoot}"`);
    return filePath;
}
exports.getProjectFilePath = getProjectFilePath;
function getLanguage(filePath) {
    const extension = path.extname(filePath);
    switch (extension) {
        case '.java':
            return 'java';
        case '.kts':
        case '.kt':
            return 'kt';
        case '.groovy':
        case '.gradle':
            return 'groovy';
        default:
            throw new errors_1.UnexpectedError(`Unexpected Android file extension: ${extension}`);
    }
}
function getFileInfo(filePath) {
    return {
        path: path.normalize(filePath),
        contents: fs_1.default.readFileSync(filePath, 'utf8'),
        language: getLanguage(filePath),
    };
}
exports.getFileInfo = getFileInfo;
async function getMainApplicationAsync(projectRoot) {
    const filePath = getProjectFilePath(projectRoot, 'MainApplication');
    return getFileInfo(filePath);
}
exports.getMainApplicationAsync = getMainApplicationAsync;
async function getMainActivityAsync(projectRoot) {
    const filePath = getProjectFilePath(projectRoot, 'MainActivity');
    return getFileInfo(filePath);
}
exports.getMainActivityAsync = getMainActivityAsync;
function getGradleFilePath(projectRoot, gradleName) {
    const groovyPath = path.resolve(projectRoot, `${gradleName}.gradle`);
    const ktPath = path.resolve(projectRoot, `${gradleName}.gradle.kts`);
    const isGroovy = fs_1.default.existsSync(groovyPath);
    const isKotlin = !isGroovy && fs_1.default.existsSync(ktPath);
    if (!isGroovy && !isKotlin) {
        throw new Error(`Failed to find '${gradleName}.gradle' file for project: ${projectRoot}.`);
    }
    const filePath = isGroovy ? groovyPath : ktPath;
    return filePath;
}
exports.getGradleFilePath = getGradleFilePath;
function getProjectBuildGradleFilePath(projectRoot) {
    return getGradleFilePath(path.join(projectRoot, 'android'), 'build');
}
exports.getProjectBuildGradleFilePath = getProjectBuildGradleFilePath;
async function getProjectBuildGradleAsync(projectRoot) {
    return getFileInfo(getProjectBuildGradleFilePath(projectRoot));
}
exports.getProjectBuildGradleAsync = getProjectBuildGradleAsync;
function getSettingsGradleFilePath(projectRoot) {
    return getGradleFilePath(path.join(projectRoot, 'android'), 'settings');
}
exports.getSettingsGradleFilePath = getSettingsGradleFilePath;
async function getSettingsGradleAsync(projectRoot) {
    return getFileInfo(getSettingsGradleFilePath(projectRoot));
}
exports.getSettingsGradleAsync = getSettingsGradleAsync;
function getAppBuildGradleFilePath(projectRoot) {
    return getGradleFilePath(path.join(projectRoot, 'android', 'app'), 'build');
}
exports.getAppBuildGradleFilePath = getAppBuildGradleFilePath;
async function getAppBuildGradleAsync(projectRoot) {
    return getFileInfo(getAppBuildGradleFilePath(projectRoot));
}
exports.getAppBuildGradleAsync = getAppBuildGradleAsync;
async function getProjectPathOrThrowAsync(projectRoot) {
    const projectPath = path.join(projectRoot, 'android');
    if (await (0, modules_1.directoryExistsAsync)(projectPath)) {
        return projectPath;
    }
    throw new Error(`Android project folder is missing in project: ${projectRoot}`);
}
exports.getProjectPathOrThrowAsync = getProjectPathOrThrowAsync;
async function getAndroidManifestAsync(projectRoot) {
    const projectPath = await getProjectPathOrThrowAsync(projectRoot);
    const filePath = path.join(projectPath, 'app/src/main/AndroidManifest.xml');
    return filePath;
}
exports.getAndroidManifestAsync = getAndroidManifestAsync;
async function getResourceFolderAsync(projectRoot) {
    const projectPath = await getProjectPathOrThrowAsync(projectRoot);
    return path.join(projectPath, `app/src/main/res`);
}
exports.getResourceFolderAsync = getResourceFolderAsync;
async function getResourceXMLPathAsync(projectRoot, { kind = 'values', name }) {
    const resourcePath = await getResourceFolderAsync(projectRoot);
    const filePath = path.join(resourcePath, `${kind}/${name}.xml`);
    return filePath;
}
exports.getResourceXMLPathAsync = getResourceXMLPathAsync;
