"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForProject = exports.resolvePackageManager = exports.RESOLUTION_ORDER = exports.BUN_LOCK_FILE = exports.PNPM_LOCK_FILE = exports.YARN_LOCK_FILE = exports.NPM_LOCK_FILE = exports.resolveWorkspaceRoot = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolve_workspace_root_1 = require("resolve-workspace-root");
const BunPackageManager_1 = require("../node/BunPackageManager");
const NpmPackageManager_1 = require("../node/NpmPackageManager");
const PnpmPackageManager_1 = require("../node/PnpmPackageManager");
const YarnPackageManager_1 = require("../node/YarnPackageManager");
var resolve_workspace_root_2 = require("resolve-workspace-root");
Object.defineProperty(exports, "resolveWorkspaceRoot", { enumerable: true, get: function () { return resolve_workspace_root_2.resolveWorkspaceRoot; } });
exports.NPM_LOCK_FILE = 'package-lock.json';
exports.YARN_LOCK_FILE = 'yarn.lock';
exports.PNPM_LOCK_FILE = 'pnpm-lock.yaml';
exports.BUN_LOCK_FILE = 'bun.lockb';
/** The order of the package managers to use when resolving automatically */
exports.RESOLUTION_ORDER = ['bun', 'yarn', 'npm', 'pnpm'];
/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a preferred packager to only resolve that one specifically.
 */
function resolvePackageManager(projectRoot, preferredManager) {
    const root = (0, resolve_workspace_root_1.resolveWorkspaceRoot)(projectRoot) ?? projectRoot;
    const lockFiles = {
        npm: exports.NPM_LOCK_FILE,
        pnpm: exports.PNPM_LOCK_FILE,
        yarn: exports.YARN_LOCK_FILE,
        bun: exports.BUN_LOCK_FILE,
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