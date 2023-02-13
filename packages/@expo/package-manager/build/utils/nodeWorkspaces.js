"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPnpmWorkspaceRoot = exports.findYarnOrNpmWorkspaceRoot = exports.PNPM_WORKSPACE_FILE = exports.PNPM_LOCK_FILE = exports.YARN_LOCK_FILE = exports.NPM_LOCK_FILE = void 0;
const find_up_1 = require("find-up");
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const micromatch_1 = __importDefault(require("micromatch"));
const path_1 = __importDefault(require("path"));
exports.NPM_LOCK_FILE = 'package-lock.json';
exports.YARN_LOCK_FILE = 'yarn.lock';
exports.PNPM_LOCK_FILE = 'pnpm-lock.yaml';
exports.PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';
/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
function findYarnOrNpmWorkspaceRoot(projectRoot) {
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
exports.findYarnOrNpmWorkspaceRoot = findYarnOrNpmWorkspaceRoot;
/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
function findPnpmWorkspaceRoot(projectRoot) {
    const workspaceEnvName = 'NPM_CONFIG_WORKSPACE_DIR';
    const workspaceEnvValue = process.env[workspaceEnvName] ?? process.env[workspaceEnvName.toLowerCase()];
    const workspaceFile = workspaceEnvValue
        ? path_1.default.join(workspaceEnvValue, exports.PNPM_WORKSPACE_FILE)
        : (0, find_up_1.sync)(exports.PNPM_WORKSPACE_FILE, { cwd: projectRoot });
    if (!workspaceFile || !fs_1.default.existsSync(workspaceFile)) {
        return null;
    }
    try {
        // See: https://pnpm.io/pnpm-workspace_yaml
        const { packages: workspaces } = js_yaml_1.default.load(fs_1.default.readFileSync(workspaceFile, 'utf8'));
        // See: https://github.com/square/find-yarn-workspace-root/blob/11f6e31d3fa15a5bb7b7419f0091390e4c16204c/index.js#L26-L33
        const workspaceRoot = path_1.default.dirname(workspaceFile);
        const relativePath = path_1.default.relative(workspaceRoot, projectRoot);
        if (relativePath === '' || (0, micromatch_1.default)([relativePath], workspaces).length > 0) {
            return workspaceRoot;
        }
    }
    catch {
        // TODO: implement debug logger?
        return null;
    }
    return null;
}
exports.findPnpmWorkspaceRoot = findPnpmWorkspaceRoot;
//# sourceMappingURL=nodeWorkspaces.js.map