"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForProject = exports.resolvePackageManager = exports.findWorkspaceRoot = exports.RESOLUTION_ORDER = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BunPackageManager_1 = require("../node/BunPackageManager");
const NpmPackageManager_1 = require("../node/NpmPackageManager");
const PnpmPackageManager_1 = require("../node/PnpmPackageManager");
const YarnPackageManager_1 = require("../node/YarnPackageManager");
const nodeWorkspaces_1 = require("./nodeWorkspaces");
/** The order of the package managers to use when resolving automatically */
exports.RESOLUTION_ORDER = ['yarn', 'npm', 'pnpm', 'bun'];
/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 */
function findWorkspaceRoot(projectRoot, preferredManager) {
    const strategies = {
        npm: nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot,
        yarn: nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot,
        pnpm: nodeWorkspaces_1.findPnpmWorkspaceRoot,
        bun: nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot,
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
        bun: nodeWorkspaces_1.BUN_LOCK_FILE,
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
 * If these options are not provided, it will infer the package manager from lockfiles.
 * When no package manager is found, it falls back to npm.
 */
function createForProject(projectRoot, options = {}) {
    if (options.npm) {
        return new NpmPackageManager_1.NpmPackageManager({ cwd: projectRoot, ...options });
    }
    else if (options.yarn) {
        return new YarnPackageManager_1.YarnPackageManager({ cwd: projectRoot, ...options });
    }
    else if (options.pnpm) {
        return new PnpmPackageManager_1.PnpmPackageManager({ cwd: projectRoot, ...options });
    }
    else if (options.bun) {
        return new BunPackageManager_1.BunPackageManager({ cwd: projectRoot, ...options });
    }
    switch (resolvePackageManager(projectRoot)) {
        case 'npm':
            return new NpmPackageManager_1.NpmPackageManager({ cwd: projectRoot, ...options });
        case 'pnpm':
            return new PnpmPackageManager_1.PnpmPackageManager({ cwd: projectRoot, ...options });
        case 'yarn':
            return new YarnPackageManager_1.YarnPackageManager({ cwd: projectRoot, ...options });
        case 'bun':
            return new BunPackageManager_1.BunPackageManager({ cwd: projectRoot, ...options });
        default:
            return new NpmPackageManager_1.NpmPackageManager({ cwd: projectRoot, ...options });
    }
}
exports.createForProject = createForProject;
//# sourceMappingURL=nodeManagers.js.map