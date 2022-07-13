"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMetroSourceMapFromProject = exports.importMetroConfigFromProject = void 0;
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
function importMetroConfigFromProject(projectRoot) {
    return importFromProject(projectRoot, 'metro-config');
}
exports.importMetroConfigFromProject = importMetroConfigFromProject;
let metroSourceMap;
function importMetroSourceMapFromProject(projectRoot) {
    if (metroSourceMap)
        return metroSourceMap;
    metroSourceMap = importFromProject(projectRoot, 'metro-source-map');
    return metroSourceMap;
}
exports.importMetroSourceMapFromProject = importMetroSourceMapFromProject;
//# sourceMappingURL=importMetroFromProject.js.map