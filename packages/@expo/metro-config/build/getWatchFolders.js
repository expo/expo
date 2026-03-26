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
 * Recursively traverse a `node_modules` directory, resolving symlinks to collect
 * the real paths of linked packages. This produces a leaner watch list for
 * installations with isolated dependencies (e.g. pnpm) by only including
 * packages that are actually depended on, rather than every workspace package.
 *
 * Returns `null` when no symlinks are found (non-isolated installation).
 */
function collectSymlinkedPackageDirs(nodeModulesDir) {
    const resolvedPaths = new Set();
    const visited = new Set();
    let hasSymlinks = false;
    function traverse(dir) {
        if (visited.has(dir))
            return;
        visited.add(dir);
        try {
            const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name[0] === '.')
                    continue;
                const targetPath = path_1.default.join(dir, entry.name);
                if (entry.name[0] === '@' && entry.isDirectory()) {
                    traverse(targetPath);
                }
                else if (entry.isSymbolicLink()) {
                    hasSymlinks = true;
                    try {
                        const resolvedPath = fs_1.default.realpathSync(targetPath);
                        let resolvedNodeModules = path_1.default.dirname(resolvedPath);
                        if (path_1.default.basename(resolvedNodeModules)[0] === '@') {
                            resolvedNodeModules = path_1.default.dirname(resolvedNodeModules);
                        }
                        resolvedPaths.add(resolvedNodeModules);
                        traverse(path_1.default.join(resolvedPath, 'node_modules'));
                    }
                    catch {
                        continue;
                    }
                }
            }
        }
        catch {
            return;
        }
    }
    traverse(nodeModulesDir);
    return hasSymlinks ? [...resolvedPaths] : null;
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
    // Check if node_modules uses symlinks (isolated dependency installations).
    // If so, only watch the packages that are actually depended on.
    const symlinks = collectSymlinkedPackageDirs(path_1.default.join(resolvedProjectRoot, 'node_modules'));
    if (symlinks) {
        const rootSymlinks = collectSymlinkedPackageDirs(path_1.default.join(workspaceRoot, 'node_modules'));
        if (rootSymlinks) {
            symlinks.push(...rootSymlinks);
        }
        return symlinks;
    }
    const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
    if (!packages?.length) {
        return [];
    }
    const packagePaths = new Set(packages.map((pkg) => path_1.default.dirname(pkg)));
    return [
        path_1.default.join(workspaceRoot, 'node_modules'),
        ...packagePaths,
    ];
}
//# sourceMappingURL=getWatchFolders.js.map