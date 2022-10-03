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
const rimraf_1 = __importDefault(require("rimraf"));
class BasePackageManager {
    constructor({ silent, log, ...options } = {}) {
        this.silent = !!silent;
        this.log = log ?? (!silent ? console.log : undefined);
        this.options = options;
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
        this.log?.(`> ${this.name} ${command.join(' ')}`);
        const spawn = (0, spawn_async_1.default)(this.bin, command, this.options);
        if (!this.silent) {
            spawn.child.stderr?.pipe(process.stderr);
        }
        return spawn;
    }
    async versionAsync() {
        return await this.runAsync(['--version']).then(({ stdout }) => stdout.trim());
    }
    async configAsync(key) {
        return await this.runAsync(['config', 'get', key]).then(({ stdout }) => stdout.trim());
    }
    async removeLockfileAsync() {
        const cwd = this.ensureCwdDefined('removeLockFile');
        const filePath = path_1.default.join(cwd, this.lockFile);
        if (fs_1.default.existsSync(filePath)) {
            rimraf_1.default.sync(filePath);
        }
    }
    installAsync(flags = []) {
        return this.runAsync(['install', ...flags]);
    }
    async uninstallAsync() {
        const cwd = this.ensureCwdDefined('uninstallAsync');
        const modulesPath = path_1.default.join(cwd, 'node_modules');
        if (fs_1.default.existsSync(modulesPath)) {
            rimraf_1.default.sync(modulesPath);
        }
    }
}
exports.BasePackageManager = BasePackageManager;
//# sourceMappingURL=BasePackageManager.js.map