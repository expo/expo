"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePackageManager = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const invariant_1 = __importDefault(require("invariant"));
const path_1 = __importDefault(require("path"));
class BasePackageManager {
    constructor({ silent, log, env = process.env, ...options } = {}) {
        // used for deferred adding of packages, e.g., when a package updates itself
        this.deferRun = false;
        this.deferredCommand = null;
        this.silent = !!silent;
        this.log = log ?? (!silent ? console.log : undefined);
        this.options = {
            stdio: silent ? undefined : 'inherit',
            ...options,
            env: { ...this.getDefaultEnvironment(), ...env },
        };
    }
    /** Get the default environment variables used when running the package manager. */
    getDefaultEnvironment() {
        return {
            ADBLOCK: '1',
            DISABLE_OPENCOLLECTIVE: '1',
        };
    }
    /** Ensure the CWD is set to a non-empty string */
    ensureCwdDefined(method) {
        const cwd = this.options.cwd?.toString();
        const className = this.constructor.name;
        const methodName = method ? `.${method}` : '';
        (0, assert_1.default)(cwd, `cwd is required for ${className}${methodName}`);
        return cwd;
    }
    runAsync(command) {
        const namePlusCommand = `${this.name} ${command.join(' ')}`;
        this.log?.(`> ${namePlusCommand}`);
        if (this.deferRun) {
            this.deferredCommand = namePlusCommand;
            // no-op to get a SpawnResult to return
            return (0, spawn_async_1.default)('echo', [''], { ...this.options, stdio: undefined });
        }
        return (0, spawn_async_1.default)(this.bin, command, this.options);
    }
    async addDeferredAsync(namesOrFlags) {
        (0, invariant_1.default)(!this.deferRun, 'addDeferredAsync cannot be called additional times while the first call is pending.');
        this.deferRun = true;
        await this.addAsync(namesOrFlags);
        const myDeferredCommand = this.deferredCommand;
        this.deferredCommand = null;
        this.deferRun = false;
        return myDeferredCommand;
    }
    async versionAsync() {
        return await this.runAsync(['--version']).then(({ stdout }) => stdout.trim());
    }
    async getConfigAsync(key) {
        return await this.runAsync(['config', 'get', key]).then(({ stdout }) => stdout.trim());
    }
    async removeLockfileAsync() {
        const cwd = this.ensureCwdDefined('removeLockFile');
        const filePath = path_1.default.join(cwd, this.lockFile);
        await fs_1.default.promises.rm(filePath, { force: true });
    }
    installAsync(flags = []) {
        return this.runAsync(['install', ...flags]);
    }
    async uninstallAsync() {
        const cwd = this.ensureCwdDefined('uninstallAsync');
        const modulesPath = path_1.default.join(cwd, 'node_modules');
        await fs_1.default.promises.rm(modulesPath, { force: true, recursive: true });
    }
}
exports.BasePackageManager = BasePackageManager;
//# sourceMappingURL=BasePackageManager.js.map