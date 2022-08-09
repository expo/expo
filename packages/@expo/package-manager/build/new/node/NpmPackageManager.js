"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmPackageManager = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const npm_package_arg_1 = __importDefault(require("npm-package-arg"));
const path_1 = __importDefault(require("path"));
const BasePackageManager_1 = require("./BasePackageManager");
class NpmPackageManager extends BasePackageManager_1.BasePackageManager {
    constructor() {
        super(...arguments);
        this.name = 'npm';
        this.bin = 'npm';
        this.lockFile = 'package-lock.json';
    }
    async addAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);
        if (versioned.length) {
            await this.updatePackageFileAsync(versioned, 'dependencies');
            await this.installAsync(flags);
        }
        if (unversioned.length) {
            await this.runAsync(['install', '--save', ...unversioned.map((spec) => spec.raw), ...flags]);
        }
    }
    async addDevAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);
        if (versioned.length) {
            await this.updatePackageFileAsync(versioned, 'devDependencies');
            await this.installAsync(flags);
        }
        if (unversioned.length) {
            await this.runAsync([
                'install',
                '--save-dev',
                ...unversioned.map((spec) => spec.raw),
                ...flags,
            ]);
        }
    }
    async addGlobalAsync(namesOrFlags = []) {
        if (!namesOrFlags.length) {
            return this.installAsync();
        }
        await this.runAsync(['install', '--global', ...namesOrFlags]);
    }
    async removeAsync(namesOrFlags) {
        await this.runAsync(['uninstall', ...namesOrFlags]);
    }
    async removeDevAsync(namesOrFlags) {
        await this.runAsync(['uninstall', '--save-dev', ...namesOrFlags]);
    }
    async removeGlobalAsync(namesOrFlags) {
        await this.runAsync(['uninstall', '--global', ...namesOrFlags]);
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
            if (spec && spec.rawSpec) {
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