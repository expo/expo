"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunPackageManager = void 0;
const BasePackageManager_1 = require("./BasePackageManager");
const nodeManagers_1 = require("../utils/nodeManagers");
class BunPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'bun';
    bin = 'bun';
    lockFile = nodeManagers_1.BUN_LOCK_FILE;
    workspaceRoot() {
        const root = (0, nodeManagers_1.resolveWorkspaceRoot)(this.ensureCwdDefined('workspaceRoot'));
        if (root) {
            return new BunPackageManager({
                ...this.options,
                silent: this.silent,
                log: this.log,
                cwd: root,
            });
        }
        return null;
    }
    installAsync(namesOrFlags = []) {
        return this.runAsync(['install', ...namesOrFlags]);
    }
    addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.runAsync(['add', ...namesOrFlags]);
    }
    addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.runAsync(['add', '--dev', ...namesOrFlags]);
    }
    addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.runAsync(['add', '--global', ...namesOrFlags]);
    }
    removeAsync(namesOrFlags) {
        return this.runAsync(['remove', ...namesOrFlags]);
    }
    removeDevAsync(namesOrFlags) {
        return this.runAsync(['remove', ...namesOrFlags]);
    }
    removeGlobalAsync(namesOrFlags) {
        return this.runAsync(['remove', '--global', ...namesOrFlags]);
    }
}
exports.BunPackageManager = BunPackageManager;
//# sourceMappingURL=BunPackageManager.js.map