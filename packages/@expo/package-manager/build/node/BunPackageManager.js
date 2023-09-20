"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunPackageManager = void 0;
const nodeWorkspaces_1 = require("../utils/nodeWorkspaces");
const BasePackageManager_1 = require("./BasePackageManager");
class BunPackageManager extends BasePackageManager_1.BasePackageManager {
    constructor() {
        super(...arguments);
        this.name = 'bun';
        this.bin = 'bun';
        this.lockFile = nodeWorkspaces_1.BUN_LOCK_FILE;
    }
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