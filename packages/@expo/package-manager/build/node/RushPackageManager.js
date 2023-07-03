"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushPackageManager = void 0;
const rush_sdk_1 = require("@rushstack/rush-sdk");
const path_1 = __importDefault(require("path"));
const BasePackageManager_1 = require("./BasePackageManager");
class RushPackageManager extends BasePackageManager_1.BasePackageManager {
    constructor(options = {}) {
        super(options);
        this.name = 'rush';
        // We run commands through Rush's bootstrap scripts (https://rushjs.io/pages/maintainer/enabling_ci_builds/#install-run-rushjs-for-bootstrapping-rush).
        this.bin = 'node';
        if (options.cwd === undefined) {
            throw new Error('cwd is required for constructing a RushPackageManager');
        }
        this.rushConfiguration = rush_sdk_1.RushConfiguration.loadFromDefaultLocation({
            startingFolder: options.cwd.toString(),
        });
        this.lockFile = this.rushConfiguration.getCommittedShrinkwrapFilename();
    }
    runAsync(command) {
        // Script commands should run through rushx (https://rushjs.io/pages/commands/rushx/).
        const rushxScript = path_1.default.join(this.rushConfiguration.commonScriptsFolder, 'install-run-rushx.js');
        return super.runAsync([rushxScript, ...command]);
    }
    async versionAsync() {
        return this.rushConfiguration.rushConfigurationJson.rushVersion;
    }
    async getConfigAsync(key) {
        // Proxy the underlying package manager to get config keys.
        const packageManagerScript = path_1.default.join(this.rushConfiguration.commonScriptsFolder, `install-run-rush-${this.rushConfiguration.packageManager}.js`);
        const { stdout } = await super.runAsync([packageManagerScript, 'config', 'get', key]);
        // Rush's bootstrap scripts include some extra lines in stdout so we just want to grab the final one.
        const lines = stdout.split('\n');
        return lines[lines.length - 1].trim();
    }
    workspaceRoot() {
        return new RushPackageManager({
            ...this.options,
            silent: this.silent,
            log: this.log,
            cwd: this.rushConfiguration.rushJsonFolder,
        });
    }
    installAsync(namesOrFlags = []) {
        const project = this.rushConfiguration.tryGetProjectForPath(this.options.cwd.toString());
        const projectFilter = project ? ['--to', project.packageName] : [];
        return this.runRush(['install', ...projectFilter, ...namesOrFlags]);
    }
    async uninstallAsync() {
        await this.runRush(['purge']);
    }
    addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { packages, flags } = parseNamesOrFlags(namesOrFlags);
        const packagesArguments = packages.map((pkg) => ['--package', pkg]).flat();
        return this.runRush(['add', ...packagesArguments, ...flags]);
    }
    addDevAsync(namesOrFlags = []) {
        return this.addAsync(['--dev', ...namesOrFlags]);
    }
    addGlobalAsync() {
        throw new Error('addGlobalAsync not implemented for RushPackageManager.');
    }
    removeAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { packages, flags } = parseNamesOrFlags(namesOrFlags);
        const packagesArguments = packages.map((pkg) => ['--package', pkg]).flat();
        return this.runRush(['remove', ...packagesArguments, ...flags]);
    }
    removeDevAsync(namesOrFlags = []) {
        return this.removeAsync(['--dev', ...namesOrFlags]);
    }
    removeGlobalAsync() {
        throw new Error('removeGlobalAsync not implemented for RushPackageManager.');
    }
    runRush(command) {
        const rushScript = path_1.default.join(this.rushConfiguration.commonScriptsFolder, 'install-run-rush.js');
        return super.runAsync([rushScript, ...command]);
    }
}
exports.RushPackageManager = RushPackageManager;
function parseNamesOrFlags(namesOrFlags) {
    const flags = namesOrFlags.filter((value) => value.startsWith('-'));
    // Rush supports version specifiers for packages so we can just take the packages (https://rushjs.io/pages/commands/rush_add/).
    const packages = namesOrFlags.filter((value) => !value.startsWith('-'));
    return { packages, flags };
}
//# sourceMappingURL=RushPackageManager.js.map