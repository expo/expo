"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForProject = exports.createFromOptions = exports.isUsingYarn = exports.isUsingPnpm = exports.isUsingNpm = exports.resolvePackageManager = exports.findWorkspaceRoot = exports.findYarnOrNpmWorkspaceRootSafe = exports.RESOLUTION_ORDER = exports.PNPM_WORKSPACE_FILE = exports.PNPM_LOCK_FILE = exports.YARN_LOCK_FILE = exports.NPM_LOCK_FILE = void 0;
const find_up_1 = require("find-up");
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const NpmPackageManager_1 = require("../node/NpmPackageManager");
const PnpmPackageManager_1 = require("../node/PnpmPackageManager");
const YarnPackageManager_1 = require("../node/YarnPackageManager");
// TODO(cedric): check if we can clean up this file and reuse the package manager methods, like `workspaceRootAsync`
exports.NPM_LOCK_FILE = 'package-lock.json';
exports.YARN_LOCK_FILE = 'yarn.lock';
exports.PNPM_LOCK_FILE = 'pnpm-lock.yaml';
exports.PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';
/** The order of the package managers to use when resolving automatically */
exports.RESOLUTION_ORDER = ['yarn', 'npm', 'pnpm'];
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
    for (const strategy of exports.RESOLUTION_ORDER.map((name) => strategies[name])) {
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
        pnpm: exports.PNPM_LOCK_FILE,
        yarn: exports.YARN_LOCK_FILE,
    };
    if (packageManager) {
        const lockfilePath = path_1.default.join(workspaceRoot, lockfileNames[packageManager]);
        if (fs_1.default.existsSync(lockfilePath)) {
            return packageManager;
        }
        return null;
    }
    for (const manager of exports.RESOLUTION_ORDER) {
        const lockfilePath = path_1.default.join(workspaceRoot, lockfileNames[manager]);
        if (fs_1.default.existsSync(lockfilePath)) {
            return manager;
        }
    }
    return null;
}
exports.resolvePackageManager = resolvePackageManager;
/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
function isUsingNpm(projectRoot) {
    return !!resolvePackageManager(projectRoot, 'npm');
}
exports.isUsingNpm = isUsingNpm;
/**
 * Returns true if the project is using pnpm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
function isUsingPnpm(projectRoot) {
    return !!resolvePackageManager(projectRoot, 'pnpm');
}
exports.isUsingPnpm = isUsingPnpm;
/**
 * Returns true if the project is using yarn, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
function isUsingYarn(projectRoot) {
    return !!resolvePackageManager(projectRoot, 'yarn');
}
exports.isUsingYarn = isUsingYarn;
/**
 * This creates a Node package manager from the provided options.
 * If all of these options are non-true, it will fallback to `nodeManagerFromProject`.
 */
function createFromOptions(projectRoot, options = {}) {
    let manager;
    if (options.npm) {
        manager = NpmPackageManager_1.NpmPackageManager;
    }
    else if (options.yarn) {
        manager = YarnPackageManager_1.YarnPackageManager;
    }
    else if (options.pnpm) {
        manager = PnpmPackageManager_1.PnpmPackageManager;
    }
    return manager
        ? new manager({ cwd: projectRoot, ...options })
        : createForProject(projectRoot, options);
}
exports.createFromOptions = createFromOptions;
/**
 * Create a Node package manager by infering the project's lockfiles.
 * If none is found, it will fallback to the npm package manager.
 */
function createForProject(projectRoot, options) {
    const managerOptions = { cwd: projectRoot, ...options };
    switch (resolvePackageManager(projectRoot)) {
        case 'npm':
            return new NpmPackageManager_1.NpmPackageManager(managerOptions);
        case 'pnpm':
            return new PnpmPackageManager_1.PnpmPackageManager(managerOptions);
        case 'yarn':
            return new YarnPackageManager_1.YarnPackageManager(managerOptions);
        default:
            return new NpmPackageManager_1.NpmPackageManager(managerOptions);
    }
}
exports.createForProject = createForProject;
//# sourceMappingURL=nodeManagers.js.map