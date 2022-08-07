"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUsingYarn = exports.resolvePackageManager = exports.findWorkspaceRoot = exports.PNPM_WORKSPACE_FILE = exports.PNPM_LOCK_FILE = exports.YARN_LOCK_FILE = exports.NPM_LOCK_FILE = void 0;
const find_up_1 = require("find-up");
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
exports.NPM_LOCK_FILE = 'package-lock.json';
exports.YARN_LOCK_FILE = 'yarn.lock';
exports.PNPM_LOCK_FILE = 'pnpm-lock.yaml';
exports.PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';
/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
function findPnpmWorkspaceRoot(projectRoot) {
    var _a;
    const workspaceEnvName = 'NPM_CONFIG_WORKSPACE_DIR';
    const workspaceEnvValue = (_a = process.env[workspaceEnvName]) !== null && _a !== void 0 ? _a : process.env[workspaceEnvName.toLowerCase()];
    const manifestLocation = workspaceEnvValue
        ? path_1.default.join(workspaceEnvValue, exports.PNPM_WORKSPACE_FILE)
        : find_up_1.sync(exports.PNPM_WORKSPACE_FILE, { cwd: projectRoot });
    return manifestLocation ? path_1.default.dirname(manifestLocation) : null;
}
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
        npm: find_yarn_workspace_root_1.default,
        yarn: find_yarn_workspace_root_1.default,
        pnpm: findPnpmWorkspaceRoot,
    };
    if (packageManager) {
        return strategies[packageManager](projectRoot);
    }
    for (const strategy of Object.values(strategies)) {
        const root = strategy(projectRoot);
        if (root)
            return root;
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
        if (fs_1.existsSync(lockfilePath))
            return packageManager;
        return null;
    }
    for (const manager of Object.keys(lockfileNames)) {
        const lockfilePath = path_1.default.join(workspaceRoot, lockfileNames[manager]);
        if (fs_1.existsSync(lockfilePath))
            return manager;
    }
    return null;
}
exports.resolvePackageManager = resolvePackageManager;
/**
 * Check if the project, or workspace root, is using Yarn.
 * @deprecated Please use `resolvePackageManager` instead to resolve either npm, yarn, or pnpm.
 */
function isUsingYarn(projectRoot) {
    return resolvePackageManager(projectRoot, 'yarn') === 'yarn';
}
exports.isUsingYarn = isUsingYarn;
//# sourceMappingURL=nodeWorkspaces.js.map