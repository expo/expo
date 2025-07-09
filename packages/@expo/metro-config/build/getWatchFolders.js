"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globAllPackageJsonPaths = globAllPackageJsonPaths;
exports.resolveAllWorkspacePackageJsonPaths = resolveAllWorkspacePackageJsonPaths;
exports.getWatchFolders = getWatchFolders;
const paths_1 = require("@expo/config/paths");
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
function readJsonFile(filePath) {
    // Read with fs
    const file = fs_1.default.readFileSync(filePath, 'utf8');
    // Parse with JSON.parse
    return JSON.parse(file);
}
function isValidJsonFile(filePath) {
    try {
        // Throws if invalid or unable to read.
        readJsonFile(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * @param workspaceProjectRoot Root file path for the yarn workspace
 * @param linkedPackages List of folders that contain linked node modules, ex: `['packages/*', 'apps/*']`
 * @returns List of valid package.json file paths, ex: `['/Users/me/app/apps/my-app/package.json', '/Users/me/app/packages/my-package/package.json']`
 */
function globAllPackageJsonPaths(workspaceProjectRoot, linkedPackages) {
    return linkedPackages
        .map((glob) => {
        // Globs should only contain `/` as separator, even on Windows.
        return (0, glob_1.globSync)(path_1.default.posix.join(glob, 'package.json').replace(/\\/g, '/'), {
            cwd: workspaceProjectRoot,
            absolute: true,
            ignore: ['**/@(Carthage|Pods|node_modules)/**'],
        }).map((pkgPath) => {
            return isValidJsonFile(pkgPath) ? pkgPath : null;
        });
    })
        .flat()
        .filter(Boolean)
        .map((p) => path_1.default.join(p));
}
/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */
function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot) {
    try {
        // Extract the "packages" array or use "workspaces" as packages array (yarn workspaces spec).
        const workspaceGlobs = (0, paths_1.getMetroWorkspaceGlobs)(workspaceProjectRoot);
        if (!workspaceGlobs?.length)
            return [];
        // Glob all package.json files and return valid paths.
        return globAllPackageJsonPaths(workspaceProjectRoot, workspaceGlobs);
    }
    catch {
        return [];
    }
}
/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */
function getWatchFolders(projectRoot) {
    const resolvedProjectRoot = path_1.default.resolve(projectRoot);
    const workspaceRoot = (0, paths_1.getMetroServerRoot)(resolvedProjectRoot);
    // Rely on default behavior in standard projects.
    if (workspaceRoot === resolvedProjectRoot) {
        return [];
    }
    const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
    if (!packages?.length) {
        return [];
    }
    return uniqueItems([
        path_1.default.join(workspaceRoot, 'node_modules'),
        ...packages.map((pkg) => path_1.default.dirname(pkg)),
    ]);
}
function uniqueItems(items) {
    return [...new Set(items)];
}
//# sourceMappingURL=getWatchFolders.js.map