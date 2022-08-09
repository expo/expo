"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YarnPackageManager = void 0;
const yarn_1 = require("../utils/yarn");
const BasePackageManager_1 = require("./BasePackageManager");
class YarnPackageManager extends BasePackageManager_1.BasePackageManager {
    constructor() {
        super(...arguments);
        this.name = 'yarn';
        this.bin = 'yarnpkg';
        this.lockFile = 'yarn.lock';
    }
    /** Check if Yarn is running in offline mode, and add the `--offline` flag */
    async withOfflineFlagAsync(namesOrFlags) {
        return (await (0, yarn_1.isYarnOfflineAsync)()) ? [...namesOrFlags, '--offline'] : namesOrFlags;
    }
    async installAsync(flags = []) {
        const args = await this.withOfflineFlagAsync(['install']);
        await this.runAsync([...args, ...flags]);
    }
    async addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const args = await this.withOfflineFlagAsync(['add', ...namesOrFlags]);
        await this.runAsync(args);
    }
    async addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const args = await this.withOfflineFlagAsync(['add', '--dev', ...namesOrFlags]);
        await this.runAsync(args);
    }
    async addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const args = await this.withOfflineFlagAsync(['global', 'add', ...namesOrFlags]);
        await this.runAsync(args);
    }
    async removeAsync(namesOrFlags) {
        await this.runAsync(['remove', ...namesOrFlags]);
    }
    async removeDevAsync(namesOrFlags) {
        await this.runAsync(['remove', ...namesOrFlags]);
    }
    async removeGlobalAsync(namesOrFlags) {
        await this.runAsync(['global', 'remove', ...namesOrFlags]);
    }
}
exports.YarnPackageManager = YarnPackageManager;
//# sourceMappingURL=YarnPackageManager.js.map