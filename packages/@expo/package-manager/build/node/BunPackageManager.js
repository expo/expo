"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunPackageManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BasePackageManager_1 = require("./BasePackageManager");
const nodeManagers_1 = require("../utils/nodeManagers");
class BunPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'bun';
    bin = 'bun';
    get lockFile() {
        const cwd = this.options.cwd?.toString() || process.cwd();
        return fs_1.default.existsSync(path_1.default.join(cwd, nodeManagers_1.BUN_LOCK_FILE)) ? nodeManagers_1.BUN_LOCK_FILE : nodeManagers_1.BUN_TEXT_LOCK_FILE;
    }
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