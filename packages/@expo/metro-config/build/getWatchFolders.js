"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWatchFolders = exports.resolveAllWorkspacePackageJsonPaths = exports.globAllPackageJsonPaths = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const assert_1 = __importDefault(require("assert"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const getModulesPaths_1 = require("./getModulesPaths");
/**
 * @param workspaceProjectRoot Root file path for the yarn workspace
 * @param linkedPackages List of folders that contain linked node modules, ex: `['packages/*', 'apps/*']`
 * @returns List of valid package.json file paths, ex: `['/Users/me/app/apps/my-app/package.json', '/Users/me/app/packages/my-package/package.json']`
 */
function globAllPackageJsonPaths(workspaceProjectRoot, linkedPackages) {
    return linkedPackages
        .map(glob => {
        return (0, glob_1.sync)(path_1.default.join(glob, 'package.json').replace(/\\/g, '/'), {
            cwd: workspaceProjectRoot,
            absolute: true,
            ignore: ['**/@(Carthage|Pods|node_modules)/**'],
        }).map(pkgPath => {
            try {
                json_file_1.default.read(pkgPath);
                return pkgPath;
            }
            catch {
                // Skip adding path if the package.json is invalid or cannot be read.
            }
            return null;
        });
    })
        .flat()
        .filter(Boolean)
        .map(p => path_1.default.join(p));
}
exports.globAllPackageJsonPaths = globAllPackageJsonPaths;
function getWorkspacePackagesArray({ workspaces }) {
    if (Array.isArray(workspaces)) {
        return workspaces;
    }
    (0, assert_1.default)(workspaces === null || workspaces === void 0 ? void 0 : workspaces.packages, 'Could not find a `workspaces` object in the root package.json');
    return workspaces.packages;
}
/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */
function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot) {
    try {
        const rootPackageJsonFilePath = path_1.default.join(workspaceProjectRoot, 'package.json');
        // Could throw if package.json is invalid.
        const rootPackageJson = json_file_1.default.read(rootPackageJsonFilePath);
        // Extract the "packages" array or use "workspaces" as packages array (yarn workspaces spec).
        const packages = getWorkspacePackagesArray(rootPackageJson);
        // Glob all package.json files and return valid paths.
        return globAllPackageJsonPaths(workspaceProjectRoot, packages);
    }
    catch {
        return [];
    }
}
exports.resolveAllWorkspacePackageJsonPaths = resolveAllWorkspacePackageJsonPaths;
/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */
function getWatchFolders(projectRoot) {
    const workspaceRoot = (0, getModulesPaths_1.getWorkspaceRoot)(path_1.default.resolve(projectRoot));
    // Rely on default behavior in standard projects.
    if (!workspaceRoot) {
        return [];
    }
    const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
    if (!packages.length) {
        return [];
    }
    return uniqueItems([
        path_1.default.join(workspaceRoot, 'node_modules'),
        ...packages.map(pkg => path_1.default.dirname(pkg)),
    ]);
}
exports.getWatchFolders = getWatchFolders;
function uniqueItems(items) {
    return [...new Set(items)];
}
//# sourceMappingURL=getWatchFolders.js.map