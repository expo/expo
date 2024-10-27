"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const ignore_1 = __importDefault(require("ignore"));
const path_1 = __importDefault(require("path"));
async function getVCSClientAsync(projectDir) {
    if (await isGitInstalledAndConfiguredAsync()) {
        return new GitClient();
    }
    else {
        return new NoVCSClient(projectDir);
    }
}
exports.default = getVCSClientAsync;
class GitClient {
    async getRootPathAsync() {
        return (await (0, spawn_async_1.default)('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
    }
    async isFileIgnoredAsync(filePath) {
        try {
            await (0, spawn_async_1.default)('git', ['check-ignore', '-q', filePath], {
                cwd: path_1.default.normalize(await this.getRootPathAsync()),
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
class NoVCSClient {
    projectDir;
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    async getRootPathAsync() {
        return this.projectDir;
    }
    async isFileIgnoredAsync(filePath) {
        const ignore = new Ignore(this.projectDir);
        await ignore.initIgnoreAsync();
        return ignore.ignores(filePath);
    }
}
async function isGitInstalledAndConfiguredAsync() {
    try {
        await (0, spawn_async_1.default)('git', ['--help']);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
    try {
        await (0, spawn_async_1.default)('git', ['rev-parse', '--show-toplevel']);
    }
    catch {
        return false;
    }
    return true;
}
const GITIGNORE_FILENAME = '.gitignore';
const DEFAULT_IGNORE = `
.git
node_modules
`;
/**
 * Ignore wraps the 'ignore' package to support multiple .gitignore files
 * in subdirectories.
 *
 * Inconsistencies with git behavior:
 * - if parent .gitignore has ignore rule and child has exception to that rule,
 *   file will still be ignored,
 * - node_modules is always ignored
 *
 * Differs from the eas-cli Ignore class by not using `.easignore`. Otherwise this is copied. May try
 * to merge the implementations soon.
 */
class Ignore {
    rootDir;
    ignoreMapping = [];
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    async initIgnoreAsync() {
        const ignoreFilePaths = (await (0, fast_glob_1.default)(`**/${GITIGNORE_FILENAME}`, {
            cwd: this.rootDir,
            ignore: ['node_modules'],
            followSymbolicLinks: false,
        }))
            // ensure that parent dir is before child directories
            .sort((a, b) => a.length - b.length && a.localeCompare(b));
        const ignoreMapping = await Promise.all(ignoreFilePaths.map(async (filePath) => {
            return [
                filePath.slice(0, filePath.length - GITIGNORE_FILENAME.length),
                (0, ignore_1.default)().add(await promises_1.default.readFile(path_1.default.join(this.rootDir, filePath), 'utf-8')),
            ];
        }));
        this.ignoreMapping = [['', (0, ignore_1.default)().add(DEFAULT_IGNORE)], ...ignoreMapping];
    }
    ignores(relativePath) {
        for (const [prefix, ignore] of this.ignoreMapping) {
            if (relativePath.startsWith(prefix) && ignore.ignores(relativePath.slice(prefix.length))) {
                return true;
            }
        }
        return false;
    }
}
