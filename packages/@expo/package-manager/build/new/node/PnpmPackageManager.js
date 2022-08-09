"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PnpmPackageManager = void 0;
const find_workspace_dir_1 = __importDefault(require("@pnpm/find-workspace-dir"));
const BasePackageManager_1 = require("./BasePackageManager");
class PnpmPackageManager extends BasePackageManager_1.BasePackageManager {
    constructor() {
        super(...arguments);
        this.name = 'pnpm';
        this.bin = 'pnpm';
        this.lockFile = 'pnpm-lock.yaml';
    }
    async workspaceRootAsync() {
        const cwd = this.ensureCwdDefined('workspaceRootAsync');
        try {
            return (await (0, find_workspace_dir_1.default)(cwd)) ?? null;
        }
        finally {
            return null;
        }
    }
    async addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        await this.runAsync(['add', ...namesOrFlags]);
    }
    async addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        await this.runAsync(['add', '--save-dev', ...namesOrFlags]);
    }
    async addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        await this.runAsync(['add', '--global', ...namesOrFlags]);
    }
    async removeAsync(namesOrFlags) {
        await this.runAsync(['remove', ...namesOrFlags]);
    }
    async removeDevAsync(namesOrFlags) {
        await this.runAsync(['remove', '--save-dev', ...namesOrFlags]);
    }
    async removeGlobalAsync(namesOrFlags) {
        await this.runAsync(['remove', '--global', ...namesOrFlags]);
    }
}
exports.PnpmPackageManager = PnpmPackageManager;
//# sourceMappingURL=PnpmPackageManager.js.map