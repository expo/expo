"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PnpmPackageManager = void 0;
const BasePackageManager_1 = require("./BasePackageManager");
const env_1 = __importDefault(require("../utils/env"));
const nodeManagers_1 = require("../utils/nodeManagers");
class PnpmPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'pnpm';
    bin = 'pnpm';
    lockFile = nodeManagers_1.PNPM_LOCK_FILE;
    workspaceRoot() {
        const root = (0, nodeManagers_1.resolveWorkspaceRoot)(this.ensureCwdDefined('workspaceRoot'));
        if (root) {
            return new PnpmPackageManager({
                ...this.options,
                silent: this.silent,
                log: this.log,
                cwd: root,
            });
        }
        return null;
    }
    installAsync(namesOrFlags = []) {
        if (env_1.default.CI && !namesOrFlags.join(' ').includes('frozen-lockfile')) {
            namesOrFlags.unshift('--no-frozen-lockfile');
        }
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
        return this.runAsync(['add', '--save-dev', ...namesOrFlags]);
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
        return this.runAsync(['remove', '--save-dev', ...namesOrFlags]);
    }
    removeGlobalAsync(namesOrFlags) {
        return this.runAsync(['remove', '--global', ...namesOrFlags]);
    }
}
exports.PnpmPackageManager = PnpmPackageManager;
//# sourceMappingURL=PnpmPackageManager.js.map