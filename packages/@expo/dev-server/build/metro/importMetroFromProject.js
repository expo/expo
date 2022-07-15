"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importHermesCommandFromProject = exports.importExpoMetroConfigFromProject = exports.importInspectorProxyServerFromProject = exports.importCliServerApiFromProject = exports.importMetroServerFromProject = exports.importMetroFromProject = exports.importMetroConfigFromProject = exports.importMetroSourceMapComposeSourceMapsFromProject = void 0;
const os_1 = __importDefault(require("os"));
const resolve_from_1 = __importDefault(require("resolve-from"));
class MetroImportError extends Error {
    constructor(projectRoot, moduleId) {
        super(`Missing package "${moduleId}" in the project at: ${projectRoot}\n` +
            'This usually means `react-native` is not installed. ' +
            'Please verify that dependencies in package.json include "react-native" ' +
            'and run `yarn` or `npm install`.');
    }
}
function resolveFromProject(projectRoot, moduleId) {
    const resolvedPath = resolve_from_1.default.silent(projectRoot, moduleId);
    if (!resolvedPath) {
        throw new MetroImportError(projectRoot, moduleId);
    }
    return resolvedPath;
}
function importFromProject(projectRoot, moduleId) {
    return require(resolveFromProject(projectRoot, moduleId));
}
function importMetroSourceMapComposeSourceMapsFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro-source-map/src/composeSourceMaps');
}
exports.importMetroSourceMapComposeSourceMapsFromProject = importMetroSourceMapComposeSourceMapsFromProject;
function importMetroConfigFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro-config');
}
exports.importMetroConfigFromProject = importMetroConfigFromProject;
function importMetroFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro');
}
exports.importMetroFromProject = importMetroFromProject;
function importMetroServerFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro/src/Server');
}
exports.importMetroServerFromProject = importMetroServerFromProject;
function importCliServerApiFromProject(projectRoot) {
    return importFromProject(projectRoot, '@react-native-community/cli-server-api');
}
exports.importCliServerApiFromProject = importCliServerApiFromProject;
function importInspectorProxyServerFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro-inspector-proxy');
}
exports.importInspectorProxyServerFromProject = importInspectorProxyServerFromProject;
function importExpoMetroConfigFromProject(projectRoot) {
    return importFromProject(projectRoot, '@expo/metro-config');
}
exports.importExpoMetroConfigFromProject = importExpoMetroConfigFromProject;
function importHermesCommandFromProject(projectRoot) {
    const platformExecutable = getHermesCommandPlatform();
    return resolveFromProject(projectRoot, `hermes-engine/${platformExecutable}`);
}
exports.importHermesCommandFromProject = importHermesCommandFromProject;
function getHermesCommandPlatform() {
    switch (os_1.default.platform()) {
        case 'darwin':
            return 'osx-bin/hermesc';
        case 'linux':
            return 'linux64-bin/hermesc';
        case 'win32':
            return 'win64-bin/hermesc.exe';
        default:
            throw new Error(`Unsupported host platform for Hermes compiler: ${os_1.default.platform()}`);
    }
}
//# sourceMappingURL=importMetroFromProject.js.map