"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForProject = exports.createFromOptions = exports.resolvePackageManager = exports.findWorkspaceRoot = exports.RESOLUTION_ORDER = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const NpmPackageManager_1 = require("../node/NpmPackageManager");
const PnpmPackageManager_1 = require("../node/PnpmPackageManager");
const YarnPackageManager_1 = require("../node/YarnPackageManager");
const nodeWorkspaces_1 = require("./nodeWorkspaces");
/** The order of the package managers to use when resolving automatically */
exports.RESOLUTION_ORDER = ['yarn', 'npm', 'pnpm'];
/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 */
function findWorkspaceRoot(projectRoot, preferredManager) {
    const strategies = {
        npm: nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot,
        yarn: nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot,
        pnpm: nodeWorkspaces_1.findPnpmWorkspaceRoot,
    };
    if (preferredManager) {
        return strategies[preferredManager](projectRoot);
    }
    for (const strategy of exports.RESOLUTION_ORDER) {
        const root = strategies[strategy](projectRoot);
        if (root) {
            return root;
        }
    }
    return null;
}
exports.findWorkspaceRoot = findWorkspaceRoot;
/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a preferred packager to only resolve that one specifically.
 */
function resolvePackageManager(projectRoot, preferredManager) {
    const root = findWorkspaceRoot(projectRoot, preferredManager) ?? projectRoot;
    const lockFiles = {
        npm: nodeWorkspaces_1.NPM_LOCK_FILE,
        pnpm: nodeWorkspaces_1.PNPM_LOCK_FILE,
        yarn: nodeWorkspaces_1.YARN_LOCK_FILE,
    };
    if (preferredManager) {
        if (fs_1.default.existsSync(path_1.default.join(root, lockFiles[preferredManager]))) {
            return preferredManager;
        }
        return null;
    }
    for (const managerName of exports.RESOLUTION_ORDER) {
        if (fs_1.default.existsSync(path_1.default.join(root, lockFiles[managerName]))) {
            return managerName;
        }
    }
    return null;
}
exports.resolvePackageManager = resolvePackageManager;
/**
 * This creates a Node package manager from the provided options.
 * If all of these options are non-true, it will fallback to `createForProject`.
 */
function createFromOptions(projectRoot, options = {}) {
    let Manager;
    if (options.npm) {
        Manager = NpmPackageManager_1.NpmPackageManager;
    }
    else if (options.yarn) {
        Manager = YarnPackageManager_1.YarnPackageManager;
    }
    else if (options.pnpm) {
        Manager = PnpmPackageManager_1.PnpmPackageManager;
    }
    return Manager
        ? new Manager({ cwd: projectRoot, ...options })
        : createForProject(projectRoot, options);
}
exports.createFromOptions = createFromOptions;
/**
 * Create a Node package manager by infering the project's lockfiles.
 * If none is found, it will fallback to the npm package manager.
 */
function createForProject(projectRoot, options = {}) {
    switch (resolvePackageManager(projectRoot)) {
        case 'npm':
            return new NpmPackageManager_1.NpmPackageManager({ cwd: projectRoot, ...options });
        case 'pnpm':
            return new PnpmPackageManager_1.PnpmPackageManager({ cwd: projectRoot, ...options });
        case 'yarn':
            return new YarnPackageManager_1.YarnPackageManager({ cwd: projectRoot, ...options });
        default:
            return new NpmPackageManager_1.NpmPackageManager({ cwd: projectRoot, ...options });
    }
}
exports.createForProject = createForProject;
//# sourceMappingURL=nodeManagers.js.map