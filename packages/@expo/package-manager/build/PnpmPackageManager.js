"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PnpmPackageManager = exports.PnpmStdoutTransform = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const ansi_regex_1 = __importDefault(require("ansi-regex"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const split_1 = __importDefault(require("split"));
const stream_1 = require("stream");
const NodePackageManagers_1 = require("./NodePackageManagers");
const ansi = `(?:${(0, ansi_regex_1.default)().source})*`;
const startPnpmPeerDependencyWarningPattern = new RegExp(`${ansi}WARN${ansi}.*Issues with peer dependencies found`, 'g');
/** Exposed for testing */
class PnpmStdoutTransform extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.isPeerDepsWarning = false;
    }
    _transform(chunk, encoding, callback) {
        const line = chunk.toString();
        if (!this.isPeerDepsWarning && startPnpmPeerDependencyWarningPattern.test(line)) {
            this.isPeerDepsWarning = true;
        }
        else if (this.isPeerDepsWarning && !line) {
            this.isPeerDepsWarning = false;
        }
        if (!this.isPeerDepsWarning) {
            this.push(line);
        }
        callback();
    }
}
exports.PnpmStdoutTransform = PnpmStdoutTransform;
class PnpmPackageManager {
    constructor({ cwd, log, silent }) {
        this.log = log || console.log;
        this.options = {
            env: {
                ...process.env,
                ...NodePackageManagers_1.DISABLE_ADS_ENV,
            },
            cwd,
            ...(silent
                ? { ignoreStdio: true }
                : {
                    stdio: ['inherit', 'inherit', 'pipe'],
                }),
        };
    }
    get name() {
        return 'pnpm';
    }
    async installAsync() {
        await this._runAsync(['install']);
    }
    async addWithParametersAsync(names, parameters) {
        if (!names.length)
            return this.installAsync();
        await this._runAsync(['add', ...parameters, ...names]);
    }
    async addAsync(...names) {
        await this.addWithParametersAsync(names, []);
    }
    async addDevAsync(...names) {
        if (!names.length)
            return this.installAsync();
        await this._runAsync(['add', '--save-dev', ...names]);
    }
    async addGlobalAsync(...names) {
        if (!names.length)
            return this.installAsync();
        await this._runAsync(['add', '--global', ...names]);
    }
    async removeAsync(...names) {
        await this._runAsync(['remove', ...names]);
    }
    async versionAsync() {
        const { stdout } = await (0, spawn_async_1.default)('pnpm', ['--version'], { stdio: 'pipe' });
        return stdout.trim();
    }
    async getConfigAsync(key) {
        const { stdout } = await (0, spawn_async_1.default)('pnpm', ['config', 'get', key], { stdio: 'pipe' });
        return stdout.trim();
    }
    async removeLockfileAsync() {
        (0, assert_1.default)(this.options.cwd, 'cwd required for PnpmPackageManager.removeLockfileAsync');
        const lockfilePath = path_1.default.join(this.options.cwd.toString(), 'pnpm-lock.yaml');
        if (fs_1.default.existsSync(lockfilePath)) {
            rimraf_1.default.sync(lockfilePath);
        }
    }
    async cleanAsync() {
        (0, assert_1.default)(this.options.cwd, 'cwd required for PnpmPackageManager.cleanAsync');
        const nodeModulesPath = path_1.default.join(this.options.cwd.toString(), 'node_modules');
        if (fs_1.default.existsSync(nodeModulesPath)) {
            rimraf_1.default.sync(nodeModulesPath);
        }
    }
    // Private
    async _runAsync(args) {
        if (!this.options.ignoreStdio) {
            this.log(`> pnpm ${args.join(' ')}`);
        }
        // Have spawnAsync consume stdio but we don't actually do anything with it if it's ignored
        const promise = (0, spawn_async_1.default)('pnpm', args, { ...this.options, ignoreStdio: false });
        if (promise.child.stdout && !this.options.ignoreStdio) {
            promise.child.stdout
                .pipe((0, split_1.default)(/\r?\n/, (line) => line + '\n'))
                .pipe(new PnpmStdoutTransform())
                .pipe(process.stdout);
        }
        return promise;
    }
}
exports.PnpmPackageManager = PnpmPackageManager;
//# sourceMappingURL=PnpmPackageManager.js.map