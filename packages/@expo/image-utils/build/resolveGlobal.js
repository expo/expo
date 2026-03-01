"use strict";
// NOTE: This file is replicated to multiple packages! Keep these files in-sync:
// - packages/@expo/cli/src/utils/resolveGlobal.ts
// - packages/@expo/image-utils/src/resolveGlobal.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGlobal = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const module_1 = __importDefault(require("module"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const memoize = (fn) => {
    let result;
    return (...args) => {
        if (result === undefined) {
            result = { value: fn(...args) };
        }
        return result.value;
    };
};
const isWindows = process.platform === 'win32';
const getDelimitedPaths = (delimited) => delimited
    .split(path_1.default.delimiter)
    .map((target) => {
    try {
        const normalized = path_1.default.normalize(target.trim());
        if (!normalized) {
            return null;
        }
        else if (!path_1.default.isAbsolute(normalized)) {
            return path_1.default.resolve(process.cwd(), normalized);
        }
        else {
            return normalized;
        }
    }
    catch {
        return null;
    }
})
    .filter((target) => !!target);
const execGetPaths = (cmd, args) => {
    const result = (0, child_process_1.spawnSync)(cmd, args, { encoding: 'utf8' });
    if (!result.error && result.status === 0 && result.stdout) {
        const paths = getDelimitedPaths(result.stdout.replace(/[\r\n]+/g, path_1.default.delimiter));
        return paths.filter((target) => fs_1.default.existsSync(target));
    }
    return [];
};
const getNativeNodePaths = () => {
    if (Array.isArray(module_1.default.globalPaths)) {
        return module_1.default.globalPaths;
    }
    else {
        return [];
    }
};
const getHomePath = memoize(() => {
    try {
        return os_1.default.homedir();
    }
    catch {
        return isWindows ? (process.env.UserProfile ?? process.env.USERPROFILE) : process.env.HOME;
    }
});
const getNpmDefaultPaths = () => {
    const prefix = [];
    const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
    if (isWindows && localAppData) {
        prefix.push(path_1.default.resolve(localAppData, 'npm'));
    }
    else if (!isWindows) {
        prefix.push('/usr/local/lib/node_modules');
    }
    return prefix.filter((target) => fs_1.default.existsSync(target));
};
const getNpmPrefixPaths = memoize(() => {
    const npmPrefix = execGetPaths(isWindows ? 'npm.cmd' : 'npm', ['config', '-g', 'get', 'prefix']);
    return npmPrefix.map((prefix) => path_1.default.resolve(prefix, 'lib'));
});
const getYarnDefaultPaths = () => {
    const prefix = [];
    const homePath = getHomePath();
    const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
    const dataHomePath = process.env.XDG_DATA_HOME || (homePath && path_1.default.join(homePath, '.local', 'share'));
    if (isWindows && localAppData) {
        prefix.push(path_1.default.resolve(localAppData, 'Yarn', 'global'));
    }
    if (dataHomePath) {
        prefix.push(path_1.default.resolve(dataHomePath, 'yarn', 'global'));
    }
    if (homePath) {
        prefix.push(path_1.default.resolve(homePath, '.yarn', 'global'));
    }
    return prefix.filter((target) => fs_1.default.existsSync(target));
};
const getYarnPrefixPaths = memoize(() => {
    return execGetPaths(isWindows ? 'yarn.cmd' : 'yarn', ['global', 'dir']);
});
const getPnpmPrefixPaths = memoize(() => {
    return execGetPaths(isWindows ? 'pnpm.cmd' : 'pnpm', ['root', '-g']);
});
const getBunPrefixPaths = memoize(() => {
    const prefix = [];
    const bunPath = execGetPaths(isWindows ? 'bun.cmd' : 'bun', ['pm', 'bin', '-g'])[0];
    if (!bunPath) {
        return [];
    }
    prefix.push(path_1.default.resolve(bunPath, 'global'));
    const moduleEntry = fs_1.default.readdirSync(bunPath, { withFileTypes: true }).find((entry) => {
        return entry.isSymbolicLink() && entry.name !== 'global';
    });
    if (moduleEntry) {
        try {
            const moduleTarget = fs_1.default.realpathSync(path_1.default.resolve(bunPath, moduleEntry.name));
            const splitIdx = moduleTarget.indexOf(path_1.default.sep + 'node_modules' + path_1.default.sep);
            if (splitIdx > -1) {
                const modulePath = moduleTarget.slice(0, splitIdx);
                prefix.push(modulePath);
            }
        }
        catch { }
    }
    return prefix.filter((target) => fs_1.default.existsSync(target));
});
const getPaths = () => [
    ...getNpmDefaultPaths(),
    ...getNpmPrefixPaths(),
    ...getYarnDefaultPaths(),
    ...getYarnPrefixPaths(),
    ...getPnpmPrefixPaths(),
    ...getBunPrefixPaths(),
    ...getNativeNodePaths(),
    process.cwd(),
];
/** Resolve a globally installed module before a locally installed one */
const resolveGlobal = (id) => {
    return require.resolve(id, { paths: getPaths() });
};
exports.resolveGlobal = resolveGlobal;
//# sourceMappingURL=resolveGlobal.js.map