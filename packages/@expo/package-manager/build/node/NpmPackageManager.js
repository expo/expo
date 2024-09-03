"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmPackageManager = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const npm_package_arg_1 = __importDefault(require("npm-package-arg"));
const path_1 = __importDefault(require("path"));
const BasePackageManager_1 = require("./BasePackageManager");
const nodeManagers_1 = require("../utils/nodeManagers");
const spawn_1 = require("../utils/spawn");
class NpmPackageManager extends BasePackageManager_1.BasePackageManager {
    name = 'npm';
    bin = 'npm';
    lockFile = nodeManagers_1.NPM_LOCK_FILE;
    workspaceRoot() {
        const root = (0, nodeManagers_1.resolveWorkspaceRoot)(this.ensureCwdDefined('workspaceRoot'));
        if (root) {
            return new NpmPackageManager({
                ...this.options,
                silent: this.silent,
                log: this.log,
                cwd: root,
            });
        }
        return null;
    }
    addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);
        return (0, spawn_1.createPendingSpawnAsync)(() => this.updatePackageFileAsync(versioned, 'dependencies'), () => !unversioned.length
            ? this.runAsync(['install', ...flags])
            : this.runAsync(['install', '--save', ...flags, ...unversioned.map((spec) => spec.raw)]));
    }
    addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);
        return (0, spawn_1.createPendingSpawnAsync)(() => this.updatePackageFileAsync(versioned, 'devDependencies'), () => !unversioned.length
            ? this.runAsync(['install', ...flags])
            : this.runAsync([
                'install',
                '--save-dev',
                ...flags,
                ...unversioned.map((spec) => spec.raw),
            ]));
    }
    addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        return this.runAsync(['install', '--global', ...namesOrFlags]);
    }
    removeAsync(namesOrFlags) {
        return this.runAsync(['uninstall', ...namesOrFlags]);
    }
    removeDevAsync(namesOrFlags) {
        return this.runAsync(['uninstall', '--save-dev', ...namesOrFlags]);
    }
    removeGlobalAsync(namesOrFlags) {
        return this.runAsync(['uninstall', '--global', ...namesOrFlags]);
    }
    runBinAsync(command, options = {}) {
        this.log?.(`> npx ${command.join(' ')}`);
        return (0, spawn_async_1.default)('npx', command, { ...this.options, ...options });
    }
    /**
     * Parse all package specifications from the names or flag list.
     * The result from this method can be used for `.updatePackageFileAsync`.
     */
    parsePackageSpecs(namesOrFlags) {
        const result = { flags: [], versioned: [], unversioned: [] };
        namesOrFlags
            .map((name) => {
            if (name.trim().startsWith('-')) {
                result.flags.push(name);
                return null;
            }
            return (0, npm_package_arg_1.default)(name);
        })
            .forEach((spec) => {
            // When using a dist-tag version of a library, we need to consider it as "unversioned".
            // Doing so will install that version with `npm install --save(-dev)`, and resolve the dist-tag properly.
            const hasExactSpec = !!spec && spec.rawSpec !== '' && spec.rawSpec !== '*';
            if (spec && hasExactSpec && spec.type !== 'tag') {
                result.versioned.push(spec);
            }
            else if (spec) {
                result.unversioned.push(spec);
            }
        });
        return result;
    }
    /**
     * Older npm versions have issues with mismatched nested dependencies when adding exact versions.
     * This propagates as issues like mismatched `@expo/config-pugins` versions.
     * As a workaround, we update the `package.json` directly and run `npm install`.
     */
    async updatePackageFileAsync(packageSpecs, packageType) {
        if (!packageSpecs.length) {
            return;
        }
        const pkgPath = path_1.default.join(this.options.cwd?.toString() || '.', 'package.json');
        const pkg = await json_file_1.default.readAsync(pkgPath);
        packageSpecs.forEach((spec) => {
            pkg[packageType] = pkg[packageType] || {};
            pkg[packageType][spec.name] = spec.rawSpec;
        });
        await json_file_1.default.writeAsync(pkgPath, pkg, { json5: false });
    }
}
exports.NpmPackageManager = NpmPackageManager;
//# sourceMappingURL=NpmPackageManager.js.map