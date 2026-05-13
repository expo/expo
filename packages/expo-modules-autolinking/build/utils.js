"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackageJson = exports.maybeRealpath = exports.fastJoin = exports.fileExistsAsync = void 0;
exports.listFilesSorted = listFilesSorted;
exports.listFilesInDirectories = listFilesInDirectories;
exports.scanFilesRecursively = scanFilesRecursively;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const memoize_1 = require("./memoize");
/** List filtered top-level files in `targetPath` (returns absolute paths) */
async function listFilesSorted(targetPath, filter) {
    try {
        // `readdir` isn't guaranteed to be sorted on Windows
        return (await fs_1.default.promises.readdir(targetPath, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && filter(entry.name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => path_1.default.join(targetPath, entry.name));
    }
    catch {
        return [];
    }
}
/** List nested files in top-level directories in `targetPath` (returns relative paths) */
async function listFilesInDirectories(targetPath, filter) {
    return (await Promise.all((await fs_1.default.promises.readdir(targetPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async (directory) => {
        const entries = await fs_1.default.promises.readdir(path_1.default.join(targetPath, directory.name), {
            withFileTypes: true,
        });
        return entries
            .filter((entry) => entry.isFile() && filter(entry.name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => path_1.default.join(directory.name, entry.name));
    }))).flat(1);
}
/** Iterate folders recursively for files, optionally sorting results and filtering directories */
async function* scanFilesRecursively(parentPath, includeDirectory, sort = !fs_1.default.opendir) {
    const queue = [parentPath];
    let targetPath;
    while (queue.length > 0 && (targetPath = queue.shift()) != null) {
        try {
            const entries = sort
                ? (await fs_1.default.promises.readdir(targetPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
                : await fs_1.default.promises.opendir(targetPath);
            for await (const entry of entries) {
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    if (!includeDirectory || includeDirectory(targetPath, entry.name)) {
                        queue.push(path_1.default.join(targetPath, entry.name));
                    }
                }
                else if (entry.isFile()) {
                    yield {
                        path: path_1.default.join(targetPath, entry.name),
                        parentPath: targetPath,
                        name: entry.name,
                    };
                }
            }
        }
        catch {
            continue;
        }
    }
}
const fileExistsAsync = async (file) => {
    const stat = await fs_1.default.promises.stat(file).catch(() => null);
    return stat?.isFile() ? file : null;
};
exports.fileExistsAsync = fileExistsAsync;
exports.fastJoin = path_1.default.sep === '/'
    ? (from, append) => `${from}${path_1.default.sep}${append}`
    : (from, append) => `${from}${path_1.default.sep}${append[0] === '@' ? append.replace('/', path_1.default.sep) : append}`;
const maybeRealpath = async (target) => {
    try {
        return await fs_1.default.promises.realpath(target);
    }
    catch {
        return null;
    }
};
exports.maybeRealpath = maybeRealpath;
exports.loadPackageJson = (0, memoize_1.memoize)(async function loadPackageJson(jsonPath) {
    try {
        const packageJsonText = await fs_1.default.promises.readFile(jsonPath, 'utf8');
        const json = JSON.parse(packageJsonText);
        if (typeof json !== 'object' || json == null) {
            return null;
        }
        return json;
    }
    catch {
        return null;
    }
});
//# sourceMappingURL=utils.js.map