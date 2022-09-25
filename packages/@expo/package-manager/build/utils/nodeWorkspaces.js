"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUsingNpm = exports.isUsingYarn = exports.resolvePackageManager = exports.findWorkspaceRoot = exports.findYarnOrNpmWorkspaceRootSafe = exports.managerResolutionOrder = exports.PNPM_WORKSPACE_FILE = exports.PNPM_LOCK_FILE = exports.YARN_LOCK_FILE = exports.NPM_LOCK_FILE = void 0;
const find_up_1 = require("find-up");
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
exports.NPM_LOCK_FILE = 'package-lock.json';
exports.YARN_LOCK_FILE = 'yarn.lock';
exports.PNPM_LOCK_FILE = 'pnpm-lock.yaml';
exports.PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';
exports.managerResolutionOrder = ['yarn', 'npm', 'pnpm'];
/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
function findPnpmWorkspaceRoot(projectRoot) {
    const workspaceEnvName = 'NPM_CONFIG_WORKSPACE_DIR';
    const workspaceEnvValue = process.env[workspaceEnvName] ?? process.env[workspaceEnvName.toLowerCase()];
    const manifestLocation = workspaceEnvValue
        ? path_1.default.join(workspaceEnvValue, exports.PNPM_WORKSPACE_FILE)
        : (0, find_up_1.sync)(exports.PNPM_WORKSPACE_FILE, { cwd: projectRoot });
    return manifestLocation ? path_1.default.dirname(manifestLocation) : null;
}
/** Wraps `findYarnOrNpmWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
function findYarnOrNpmWorkspaceRootSafe(projectRoot) {
    try {
        return (0, find_yarn_workspace_root_1.default)(projectRoot);
    }
    catch (error) {
        if (error.message.includes('Unexpected end of JSON input')) {
            return null;
        }
        throw error;
    }
}
exports.findYarnOrNpmWorkspaceRootSafe = findYarnOrNpmWorkspaceRootSafe;
/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 *
 * By default, this tries to resolve the workspaces in order of:
 *  - npm
 *  - yarn
 *  - pnpm
 */
function findWorkspaceRoot(projectRoot, packageManager) {
    const strategies = {
        npm: findYarnOrNpmWorkspaceRootSafe,
        yarn: findYarnOrNpmWorkspaceRootSafe,
        pnpm: findPnpmWorkspaceRoot,
    };
    if (packageManager) {
        return strategies[packageManager](projectRoot);
    }
    for (const strategy of exports.managerResolutionOrder.map((name) => strategies[name])) {
        const root = strategy(projectRoot);
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
 * Optionally, provide a specific packager to only resolve that one specifically.
 *
 * By default, this tries to resolve the workspaces in order of:
 *  - npm
 *  - yarn
 *  - pnpm
 */
function resolvePackageManager(projectRoot, packageManager) {
    const workspaceRoot = findWorkspaceRoot(projectRoot, packageManager) || projectRoot;
    const lockfileNames = {
        npm: exports.NPM_LOCK_FILE,
        yarn: exports.YARN_LOCK_FILE,
        pnpm: exports.PNPM_LOCK_FILE,
    };
    if (packageManager) {
        const lockfilePath = path_1.default.join(workspaceRoot, lockfileNames[packageManager]);
        if ((0, fs_1.existsSync)(lockfilePath)) {
            return packageManager;
        }
        return null;
    }
    for (const manager of exports.managerResolutionOrder) {
        const lockfilePath = path_1.default.join(workspaceRoot, lockfileNames[manager]);
        if ((0, fs_1.existsSync)(lockfilePath)) {
            return manager;
        }
    }
    return null;
}
exports.resolvePackageManager = resolvePackageManager;
/**
 * Returns true if the project is using yarn, false if the project is using another package manager.
 */
function isUsingYarn(projectRoot) {
    return !!resolvePackageManager(projectRoot, 'yarn');
}
exports.isUsingYarn = isUsingYarn;
/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 */
function isUsingNpm(projectRoot) {
    return !!resolvePackageManager(projectRoot, 'npm');
}
exports.isUsingNpm = isUsingNpm;
//# sourceMappingURL=nodeWorkspaces.js.map