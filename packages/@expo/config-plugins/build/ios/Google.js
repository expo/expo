"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGoogleServicesFile = exports.setGoogleConfig = exports.setGoogleSignInReversedClientId = exports.getGoogleServicesFile = exports.getGoogleSignInReversedClientId = exports.withGoogleServicesFile = exports.withGoogle = void 0;
const plist_1 = __importDefault(require("@expo/plist"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Paths_1 = require("./Paths");
const Scheme_1 = require("./Scheme");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
const withGoogle = (config) => {
    return (0, ios_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setGoogleConfig(config, config.modResults, config.modRequest);
        return config;
    });
};
exports.withGoogle = withGoogle;
const withGoogleServicesFile = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, (config) => {
        config.modResults = setGoogleServicesFile(config, {
            projectRoot: config.modRequest.projectRoot,
            project: config.modResults,
        });
        return config;
    });
};
exports.withGoogleServicesFile = withGoogleServicesFile;
function readGoogleServicesInfoPlist(relativePath, { projectRoot }) {
    const googleServiceFilePath = path_1.default.resolve(projectRoot, relativePath);
    const contents = fs_1.default.readFileSync(googleServiceFilePath, 'utf8');
    (0, assert_1.default)(contents, 'GoogleService-Info.plist is empty');
    return plist_1.default.parse(contents);
}
function getGoogleSignInReversedClientId(config, modRequest) {
    const googleServicesFileRelativePath = getGoogleServicesFile(config);
    if (googleServicesFileRelativePath === null) {
        return null;
    }
    const infoPlist = readGoogleServicesInfoPlist(googleServicesFileRelativePath, modRequest);
    return infoPlist.REVERSED_CLIENT_ID ?? null;
}
exports.getGoogleSignInReversedClientId = getGoogleSignInReversedClientId;
function getGoogleServicesFile(config) {
    return config.ios?.googleServicesFile ?? null;
}
exports.getGoogleServicesFile = getGoogleServicesFile;
function setGoogleSignInReversedClientId(config, infoPlist, modRequest) {
    const reversedClientId = getGoogleSignInReversedClientId(config, modRequest);
    if (reversedClientId === null) {
        return infoPlist;
    }
    return (0, Scheme_1.appendScheme)(reversedClientId, infoPlist);
}
exports.setGoogleSignInReversedClientId = setGoogleSignInReversedClientId;
function setGoogleConfig(config, infoPlist, modRequest) {
    infoPlist = setGoogleSignInReversedClientId(config, infoPlist, modRequest);
    return infoPlist;
}
exports.setGoogleConfig = setGoogleConfig;
function setGoogleServicesFile(config, { projectRoot, project }) {
    const googleServicesFileRelativePath = getGoogleServicesFile(config);
    if (googleServicesFileRelativePath === null) {
        return project;
    }
    const googleServiceFilePath = path_1.default.resolve(projectRoot, googleServicesFileRelativePath);
    fs_1.default.copyFileSync(googleServiceFilePath, path_1.default.join((0, Paths_1.getSourceRoot)(projectRoot), 'GoogleService-Info.plist'));
    const projectName = (0, Xcodeproj_1.getProjectName)(projectRoot);
    const plistFilePath = `${projectName}/GoogleService-Info.plist`;
    if (!project.hasFile(plistFilePath)) {
        project = (0, Xcodeproj_1.addResourceFileToGroup)({
            filepath: plistFilePath,
            groupName: projectName,
            project,
            isBuildFile: true,
            verbose: true,
        });
    }
    return project;
}
exports.setGoogleServicesFile = setGoogleServicesFile;
