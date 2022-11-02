"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesPath = exports.createForProject = exports.YarnPackageManager = exports.NpmPackageManager = exports.DISABLE_ADS_ENV = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const ansi_regex_1 = __importDefault(require("ansi-regex"));
const fs_1 = require("fs");
const npm_package_arg_1 = __importDefault(require("npm-package-arg"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const split_1 = __importDefault(require("split"));
const stream_1 = require("stream");
const PnpmPackageManager_1 = require("./PnpmPackageManager");
const isYarnOfflineAsync_1 = __importDefault(require("./utils/isYarnOfflineAsync"));
const nodeWorkspaces_1 = require("./utils/nodeWorkspaces");
/**
 * Disable various postinstall scripts
 * - https://github.com/opencollective/opencollective-postinstall/pull/9
 */
exports.DISABLE_ADS_ENV = { DISABLE_OPENCOLLECTIVE: '1', ADBLOCK: '1' };
const ansi = `(?:${(0, ansi_regex_1.default)().source})*`;
const npmPeerDependencyWarningPattern = new RegExp(`${ansi}npm${ansi} ${ansi}WARN${ansi}.+You must install peer dependencies yourself\\.\n`, 'g');
const yarnPeerDependencyWarningPattern = new RegExp(`${ansi}warning${ansi} "[^"]+" has (?:unmet|incorrect) peer dependency "[^"]+"\\.\n`, 'g');
class NpmStderrTransform extends stream_1.Transform {
    _transform(chunk, encoding, callback) {
        this.push(chunk.toString().replace(npmPeerDependencyWarningPattern, ''));
        callback();
    }
}
class YarnStderrTransform extends stream_1.Transform {
    _transform(chunk, encoding, callback) {
        this.push(chunk.toString().replace(yarnPeerDependencyWarningPattern, ''));
        callback();
    }
}
class NpmPackageManager {
    constructor({ cwd, log, silent }) {
        this.log = log || console.log;
        this.options = {
            env: {
                ...process.env,
                ...exports.DISABLE_ADS_ENV,
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
        return 'npm';
    }
    async installAsync(parameters = []) {
        await this._runAsync(['install', ...parameters]);
    }
    async addGlobalAsync(...names) {
        if (!names.length)
            return this.installAsync();
        await this._runAsync(['install', '--global', ...names]);
    }
    async addWithParametersAsync(names, parameters = []) {
        if (!names.length)
            return this.installAsync(parameters);
        const { versioned, unversioned } = this._parseSpecs(names);
        if (versioned.length) {
            await this._patchAsync(versioned, 'dependencies');
            await this.installAsync(parameters);
        }
        if (unversioned.length) {
            await this._runAsync([
                'install',
                '--save',
                ...unversioned.map((spec) => spec.raw),
                ...parameters,
            ]);
        }
    }
    async addAsync(...names) {
        await this.addWithParametersAsync(names, []);
    }
    async addDevAsync(...names) {
        if (!names.length)
            return this.installAsync();
        const { versioned, unversioned } = this._parseSpecs(names);
        if (versioned.length) {
            await this._patchAsync(versioned, 'devDependencies');
            await this._runAsync(['install']);
        }
        if (unversioned.length) {
            await this._runAsync(['install', '--save-dev', ...unversioned.map((spec) => spec.raw)]);
        }
    }
    async removeAsync(...names) {
        await this._runAsync(['uninstall', ...names]);
    }
    async versionAsync() {
        const { stdout } = await (0, spawn_async_1.default)('npm', ['--version'], { stdio: 'pipe' });
        return stdout.trim();
    }
    async getConfigAsync(key) {
        const { stdout } = await (0, spawn_async_1.default)('npm', ['config', 'get', key], { stdio: 'pipe' });
        return stdout.trim();
    }
    async removeLockfileAsync() {
        if (!this.options.cwd) {
            throw new Error('cwd required for NpmPackageManager.removeLockfileAsync');
        }
        const lockfilePath = path_1.default.join(this.options.cwd.toString(), 'package-lock.json');
        if ((0, fs_1.existsSync)(lockfilePath)) {
            rimraf_1.default.sync(lockfilePath);
        }
    }
    async cleanAsync() {
        if (!this.options.cwd) {
            throw new Error('cwd required for NpmPackageManager.cleanAsync');
        }
        const nodeModulesPath = path_1.default.join(this.options.cwd.toString(), 'node_modules');
        if ((0, fs_1.existsSync)(nodeModulesPath)) {
            rimraf_1.default.sync(nodeModulesPath);
        }
    }
    // Private
    async _runAsync(args) {
        if (!this.options.ignoreStdio) {
            this.log(`> npm ${args.join(' ')}`);
        }
        // Have spawnAsync consume stdio but we don't actually do anything with it if it's ignored
        const promise = (0, spawn_async_1.default)('npm', [...args], { ...this.options, ignoreStdio: false });
        if (promise.child.stderr && !this.options.ignoreStdio) {
            promise.child.stderr
                .pipe((0, split_1.default)(/\r?\n/, (line) => line + '\n'))
                .pipe(new NpmStderrTransform())
                .pipe(process.stderr);
        }
        return promise;
    }
    _parseSpecs(names) {
        const result = { versioned: [], unversioned: [] };
        names
            .map((name) => (0, npm_package_arg_1.default)(name))
            .forEach((spec) => {
            if (spec.rawSpec) {
                result.versioned.push(spec);
            }
            else {
                result.unversioned.push(spec);
            }
        });
        return result;
    }
    async _patchAsync(specs, packageType) {
        const pkgPath = path_1.default.join(this.options.cwd?.toString() || '.', 'package.json');
        const pkg = await json_file_1.default.readAsync(pkgPath);
        specs.forEach((spec) => {
            pkg[packageType] = pkg[packageType] || {};
            // @ts-ignore
            pkg[packageType][spec.name] = spec.rawSpec;
        });
        await json_file_1.default.writeAsync(pkgPath, pkg, { json5: false });
    }
}
exports.NpmPackageManager = NpmPackageManager;
class YarnPackageManager {
    constructor({ cwd, log, silent }) {
        this.log = log || console.log;
        this.options = {
            env: {
                ...process.env,
                ...exports.DISABLE_ADS_ENV,
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
        return 'Yarn';
    }
    async withOfflineSupportAsync(...args) {
        if (await (0, isYarnOfflineAsync_1.default)()) {
            args.push('--offline');
        }
        // TODO: Maybe prompt about being offline and using local yarn cache.
        return args;
    }
    async installAsync() {
        const args = await this.withOfflineSupportAsync('install');
        await this._runAsync(args);
    }
    async addGlobalAsync(...names) {
        if (!names.length)
            return this.installAsync();
        const args = await this.withOfflineSupportAsync('global', 'add');
        args.push(...names);
        await this._runAsync(args);
    }
    async addWithParametersAsync(names, parameters = []) {
        if (!names.length)
            return this.installAsync();
        const args = await this.withOfflineSupportAsync('add');
        args.push(...names);
        args.push(...parameters);
        await this._runAsync(args);
    }
    async addAsync(...names) {
        await this.addWithParametersAsync(names, []);
    }
    async addDevAsync(...names) {
        if (!names.length)
            return this.installAsync();
        const args = await this.withOfflineSupportAsync('add', '--dev');
        args.push(...names);
        await this._runAsync(args);
    }
    async removeAsync(...names) {
        await this._runAsync(['remove', ...names]);
    }
    async versionAsync() {
        const { stdout } = await (0, spawn_async_1.default)('yarnpkg', ['--version'], { stdio: 'pipe' });
        return stdout.trim();
    }
    async getConfigAsync(key) {
        const { stdout } = await (0, spawn_async_1.default)('yarnpkg', ['config', 'get', key], { stdio: 'pipe' });
        return stdout.trim();
    }
    async removeLockfileAsync() {
        if (!this.options.cwd) {
            throw new Error('cwd required for YarnPackageManager.removeLockfileAsync');
        }
        const lockfilePath = path_1.default.join(this.options.cwd.toString(), 'yarn-lock.json');
        if ((0, fs_1.existsSync)(lockfilePath)) {
            rimraf_1.default.sync(lockfilePath);
        }
    }
    async cleanAsync() {
        if (!this.options.cwd) {
            throw new Error('cwd required for YarnPackageManager.cleanAsync');
        }
        const nodeModulesPath = path_1.default.join(this.options.cwd.toString(), 'node_modules');
        if ((0, fs_1.existsSync)(nodeModulesPath)) {
            rimraf_1.default.sync(nodeModulesPath);
        }
    }
    // Private
    async _runAsync(args) {
        if (!this.options.ignoreStdio) {
            this.log(`> yarn ${args.join(' ')}`);
        }
        // Have spawnAsync consume stdio but we don't actually do anything with it if it's ignored
        const promise = (0, spawn_async_1.default)('yarnpkg', args, { ...this.options, ignoreStdio: false });
        if (promise.child.stderr && !this.options.ignoreStdio) {
            promise.child.stderr.pipe(new YarnStderrTransform()).pipe(process.stderr);
        }
        return promise;
    }
}
exports.YarnPackageManager = YarnPackageManager;
function createForProject(projectRoot, options = {}) {
    let PackageManager;
    if (options.npm) {
        PackageManager = NpmPackageManager;
    }
    else if (options.yarn) {
        PackageManager = YarnPackageManager;
    }
    else if (options.pnpm) {
        PackageManager = PnpmPackageManager_1.PnpmPackageManager;
    }
    else if ((0, nodeWorkspaces_1.isUsingYarn)(projectRoot)) {
        PackageManager = YarnPackageManager;
    }
    else if ((0, nodeWorkspaces_1.resolvePackageManager)(projectRoot, 'pnpm')) {
        PackageManager = PnpmPackageManager_1.PnpmPackageManager;
    }
    else {
        PackageManager = NpmPackageManager;
    }
    return new PackageManager({ cwd: projectRoot, log: options.log, silent: options.silent });
}
exports.createForProject = createForProject;
function getModulesPath(projectRoot) {
    const workspaceRoot = (0, nodeWorkspaces_1.findWorkspaceRoot)(path_1.default.resolve(projectRoot)); // Absolute path or null
    if (workspaceRoot) {
        return path_1.default.resolve(workspaceRoot, 'node_modules');
    }
    return path_1.default.resolve(projectRoot, 'node_modules');
}
exports.getModulesPath = getModulesPath;
//# sourceMappingURL=NodePackageManagers.js.map