"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePackageManager = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class BasePackageManager {
    silent;
    log;
    options;
    constructor({ silent, log, env = process.env, ...options } = {}) {
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
    runAsync(command, options = {}) {
        this.log?.(`> ${this.name} ${command.join(' ')}`);
        return (0, spawn_async_1.default)(this.bin, command, { ...this.options, ...options });
    }
    runBinAsync(command, options = {}) {
        this.log?.(`> ${this.name} ${command.join(' ')}`);
        return (0, spawn_async_1.default)(this.bin, command, { ...this.options, ...options });
    }
    async versionAsync() {
        const { stdout } = await this.runAsync(['--version'], { stdio: undefined });
        return stdout.trim();
    }
    async getConfigAsync(key) {
        const { stdout } = await this.runAsync(['config', 'get', key]);
        return stdout.trim();
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