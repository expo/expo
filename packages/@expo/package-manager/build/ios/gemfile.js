"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGemfile = findGemfile;
exports.isUsingBundlerAsync = isUsingBundlerAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const resolve_workspace_root_1 = require("resolve-workspace-root");
const maybeStat = (targetPath) => fs_1.default.promises.stat(path_1.default.resolve(targetPath)).catch(() => null);
async function getGitTopLevelAsync(root = process.cwd()) {
    try {
        const output = await (0, spawn_async_1.default)('git', ['rev-parse', '--show-toplevel'], { cwd: root });
        const gitRoot = path_1.default.resolve(output.stdout.trim());
        return (await maybeStat(gitRoot))?.isDirectory() ? gitRoot : null;
    }
    catch {
        return null;
    }
}
async function getGitRootPathAsync(root = process.cwd()) {
    const homeDir = path_1.default.normalize(os_1.default.homedir());
    for (let dir = root; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        if ((await maybeStat(path_1.default.join(dir, '.git')))?.isDirectory()) {
            return dir;
        }
        if (dir === homeDir)
            break;
    }
    return null;
}
async function getRootPathAsync(root = process.cwd()) {
    const rootPath = (await getGitTopLevelAsync(root)) ||
        (await getGitRootPathAsync(root)) ||
        (await (0, resolve_workspace_root_1.resolveWorkspaceRootAsync)(root)) ||
        process.cwd();
    return rootPath;
}
/** Finds a Gemfile in the target directory or a parent, stopping at the Git or workspace root. */
async function findGemfile(root = process.cwd()) {
    const rootBoundary = path_1.default.normalize(await getRootPathAsync(root));
    for (let dir = root; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        const candidate = path_1.default.join(dir, 'Gemfile');
        if ((await maybeStat(candidate))?.isFile()) {
            return candidate;
        }
        if (dir === rootBoundary)
            break;
    }
    return null;
}
/**
 * Check if the project uses Bundler to manage CocoaPods.
 * Returns `true` if a `Gemfile` exists in the project root (or a parent)
 * that lists `cocoapods` as a dependency, and `bundle exec pod --version` succeeds.
 */
async function isUsingBundlerAsync(projectRoot) {
    const gemfilePath = await findGemfile(projectRoot);
    if (!gemfilePath) {
        return false;
    }
    const [gemfileContents, podExec] = await Promise.allSettled([
        fs_1.default.promises.readFile(gemfilePath, 'utf8'),
        (0, spawn_async_1.default)('bundle', ['exec', 'pod', '--version'], {
            cwd: projectRoot,
            stdio: 'ignore',
        }),
    ]);
    if (gemfileContents.status === 'rejected' || podExec.status === 'rejected') {
        return false;
    }
    else {
        return /gem\s*\(?\s*(?:'cocoapods'|"cocoapods")/.test(gemfileContents.value);
    }
}
//# sourceMappingURL=gemfile.js.map