"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YarnPackageManager = void 0;
const BasePackageManager_1 = require("./BasePackageManager");
const nodeManagers_1 = require("../utils/nodeManagers");
const spawn_1 = require("../utils/spawn");
const yarn_1 = require("../utils/yarn");
class YarnPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'yarn';
    bin = 'yarnpkg';
    lockFile = nodeManagers_1.YARN_LOCK_FILE;
    /** Check if Yarn is running in offline mode, and add the `--offline` flag */
    async withOfflineFlagAsync(namesOrFlags) {
        return (await (0, yarn_1.isYarnOfflineAsync)()) ? [...namesOrFlags, '--offline'] : namesOrFlags;
    }
    workspaceRoot() {
        const root = (0, nodeManagers_1.resolveWorkspaceRoot)(this.ensureCwdDefined('workspaceRoot'));
        if (root) {
            return new YarnPackageManager({
                ...this.options,
                silent: this.silent,
                log: this.log,
                cwd: root,
            });
        }
        return null;
    }
    installAsync(flags = []) {
        return (0, spawn_1.createPendingSpawnAsync)(() => this.withOfflineFlagAsync(['install']), (args) => this.runAsync([...args, ...flags]));
    }
    addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return (0, spawn_1.createPendingSpawnAsync)(() => this.withOfflineFlagAsync(['add', ...namesOrFlags]), (args) => this.runAsync(args));
    }
    addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return (0, spawn_1.createPendingSpawnAsync)(() => this.withOfflineFlagAsync(['add', '--dev', ...namesOrFlags]), (args) => this.runAsync(args));
    }
    addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return (0, spawn_1.createPendingSpawnAsync)(() => this.withOfflineFlagAsync(['global', 'add', ...namesOrFlags]), (args) => this.runAsync(args));
    }
    removeAsync(namesOrFlags) {
        return this.runAsync(['remove', ...namesOrFlags]);
    }
    removeDevAsync(namesOrFlags) {
        return this.runAsync(['remove', ...namesOrFlags]);
    }
    removeGlobalAsync(namesOrFlags) {
        return this.runAsync(['global', 'remove', ...namesOrFlags]);
    }
}
exports.YarnPackageManager = YarnPackageManager;
//# sourceMappingURL=YarnPackageManager.js.map