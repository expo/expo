"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunPackageManager = void 0;
const BasePackageManager_1 = require("./BasePackageManager");
const nodeWorkspaces_1 = require("../utils/nodeWorkspaces");
class BunPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'bun';
    bin = 'bun';
    lockFile = nodeWorkspaces_1.BUN_LOCK_FILE;
    workspaceRoot() {
        const root = (0, nodeWorkspaces_1.findYarnOrNpmWorkspaceRoot)(this.ensureCwdDefined('workspaceRoot'));
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
        return this.spawnAsync(['install', ...namesOrFlags]);
    }
    addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.spawnAsync(['add', ...namesOrFlags]);
    }
    addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.spawnAsync(['add', '--dev', ...namesOrFlags]);
    }
    addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.spawnAsync(['add', '--global', ...namesOrFlags]);
    }
    removeAsync(namesOrFlags) {
        return this.spawnAsync(['remove', ...namesOrFlags]);
    }
    removeDevAsync(namesOrFlags) {
        return this.spawnAsync(['remove', ...namesOrFlags]);
    }
    removeGlobalAsync(namesOrFlags) {
        return this.spawnAsync(['remove', '--global', ...namesOrFlags]);
    }
}
exports.BunPackageManager = BunPackageManager;
//# sourceMappingURL=BunPackageManager.js.map