"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackageJson = exports.maybeRealpath = exports.fastJoin = void 0;
exports.defaultShouldIncludeDependency = defaultShouldIncludeDependency;
exports.mergeWithDuplicate = mergeWithDuplicate;
exports.filterMapResolutionResult = filterMapResolutionResult;
exports.mergeResolutionResults = mergeResolutionResults;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const NODE_MODULES_PATTERN = `${path_1.default.sep}node_modules${path_1.default.sep}`;
// The default dependencies we exclude don't contain dependency chains leading to autolinked modules
function defaultShouldIncludeDependency(dependencyName) {
    const scopeName = dependencyName[0] === '@' ? dependencyName.slice(1, dependencyName.indexOf('/')) : null;
    if (scopeName === 'babel' ||
        scopeName === 'types' ||
        scopeName === 'eslint' ||
        scopeName === 'typescript-eslint') {
        return false;
    }
    switch (dependencyName) {
        case '@expo/cli':
        case '@expo/config':
        case '@expo/metro-config':
        case '@expo/package-manager':
        case '@expo/prebuild-config':
        case '@expo/env':
        case '@react-native/codegen':
        case 'eslint':
        case 'eslint-config-expo':
        case 'eslint-plugin-expo':
            return false;
        default:
            return true;
    }
}
exports.fastJoin = path_1.default.sep === '/'
    ? (from, append) => `${from}${path_1.default.sep}${append}`
    : (from, append) => `${from}${path_1.default.sep}${append[0] === '@' ? append.replace('/', path_1.default.sep) : append}`;
const maybeRealpath = async (target) => {
    try {
        return await fs_1.default.promises.realpath(target);
    }
    catch {
        return null;
    }
};
exports.maybeRealpath = maybeRealpath;
exports.loadPackageJson = (0, utils_1.memoize)(async function loadPackageJson(jsonPath) {
    try {
        const packageJsonText = await fs_1.default.promises.readFile(jsonPath, 'utf8');
        const json = JSON.parse(packageJsonText);
        if (typeof json !== 'object' || json == null) {
            return null;
        }
        return json;
    }
    catch {
        return null;
    }
});
function mergeWithDuplicate(a, b) {
    let target;
    let duplicate;
    if (a.depth < b.depth) {
        target = a;
        duplicate = b;
    }
    else if (b.depth < a.depth) {
        target = b;
        duplicate = a;
    }
    else {
        // If both are equal, then the shallowest path wins
        const pathDepthA = a.originPath.split(NODE_MODULES_PATTERN).length;
        const pathDepthB = b.originPath.split(NODE_MODULES_PATTERN).length;
        if (pathDepthA < pathDepthB) {
            target = a;
            duplicate = b;
        }
        else if (pathDepthB < pathDepthA) {
            target = b;
            duplicate = a;
        }
        else {
            target = a;
            duplicate = b;
        }
    }
    const duplicates = target.duplicates || (target.duplicates = []);
    if (target.path !== duplicate.path) {
        duplicates.push({
            name: duplicate.name,
            version: duplicate.version,
            path: duplicate.path,
            originPath: duplicate.originPath,
        });
    }
    if (duplicate.duplicates?.length) {
        duplicates.push(...duplicate.duplicates.filter((child) => duplicates.every((parent) => parent.path !== child.path)));
    }
    return target;
}
async function filterMapResolutionResult(results, filterMap) {
    const resolutions = await Promise.all(Object.keys(results).map(async (key) => {
        const resolution = results[key];
        return resolution ? await filterMap(resolution) : null;
    }));
    const output = Object.create(null);
    for (let idx = 0; idx < resolutions.length; idx++) {
        const resolution = resolutions[idx];
        if (resolution != null) {
            output[resolution.name] = resolution;
        }
    }
    return output;
}
function mergeResolutionResults(results) {
    if (results.length === 1) {
        return results[0];
    }
    const output = Object.create(null);
    for (let idx = 0; idx < results.length; idx++) {
        for (const key in results[idx]) {
            const resolution = results[idx][key];
            const prevResolution = output[key];
            if (prevResolution != null) {
                output[key] = mergeWithDuplicate(prevResolution, resolution);
            }
            else {
                output[key] = resolution;
            }
        }
    }
    return output;
}
//# sourceMappingURL=utils.js.map