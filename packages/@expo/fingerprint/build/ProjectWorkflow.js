"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectWorkflowAsync = resolveProjectWorkflowAsync;
exports.resolveProjectWorkflowPerPlatformAsync = resolveProjectWorkflowPerPlatformAsync;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = require("glob");
const ignore_1 = __importDefault(require("ignore"));
const path_1 = __importDefault(require("path"));
const ExpoResolver_1 = require("./ExpoResolver");
const Path_1 = require("./utils/Path");
/**
 * Replicated project workflow detection logic from eas-cli:
 * https://github.com/expo/eas-cli/blob/25cc5551899d1ed03a09e04fd5f13a9ad485bd3a/packages/eas-cli/src/project/workflow.ts
 */
async function resolveProjectWorkflowAsync(projectRoot, platform, fingerprintIgnorePaths) {
    const configPluginsPackageRoot = (0, ExpoResolver_1.resolveExpoConfigPluginsPackagePath)(projectRoot);
    if (configPluginsPackageRoot == null) {
        return 'unknown';
    }
    const { AndroidConfig, IOSConfig } = require(configPluginsPackageRoot);
    let platformWorkflowMarkers;
    try {
        platformWorkflowMarkers =
            platform === 'android'
                ? [
                    path_1.default.join(projectRoot, 'android/app/build.gradle'),
                    await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot),
                ]
                : [IOSConfig.Paths.getPBXProjectPath(projectRoot)];
    }
    catch {
        return 'managed';
    }
    const vcsClient = await getVCSClientAsync(projectRoot);
    const vcsRoot = path_1.default.normalize(await vcsClient.getRootPathAsync());
    for (const marker of platformWorkflowMarkers) {
        const relativeMarker = path_1.default.relative(vcsRoot, marker);
        if ((await (0, Path_1.pathExistsAsync)(marker)) &&
            !(0, Path_1.isIgnoredPathWithMatchObjects)(relativeMarker, fingerprintIgnorePaths) &&
            !(await vcsClient.isFileIgnoredAsync(relativeMarker))) {
            return 'generic';
        }
    }
    return 'managed';
}
async function resolveProjectWorkflowPerPlatformAsync(projectRoot, fingerprintIgnorePaths) {
    const [android, ios] = await Promise.all([
        resolveProjectWorkflowAsync(projectRoot, 'android', fingerprintIgnorePaths),
        resolveProjectWorkflowAsync(projectRoot, 'ios', fingerprintIgnorePaths),
    ]);
    return { android, ios };
}
async function getVCSClientAsync(projectRoot) {
    if (await isGitInstalledAndConfiguredAsync()) {
        return new GitClient();
    }
    else {
        return new NoVCSClient(projectRoot);
    }
}
async function isFileIgnoredByEasIgnoreAsync(projectRoot, filePath) {
    const easIgnorePath = path_1.default.join(projectRoot, EASIGNORE_FILENAME);
    if (await (0, Path_1.pathExistsAsync)(easIgnorePath)) {
        const ignore = new Ignore(projectRoot);
        await ignore.initIgnoreWithEasIgnoreAsync(await promises_1.default.readFile(easIgnorePath, 'utf-8'));
        return ignore.ignores(filePath);
    }
    return undefined;
}
class GitClient {
    async getRootPathAsync() {
        return (await (0, spawn_async_1.default)('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
    }
    async isFileIgnoredAsync(filePath) {
        const ignoredByEasIgnore = await isFileIgnoredByEasIgnoreAsync(await this.getRootPathAsync(), filePath);
        if (ignoredByEasIgnore !== undefined) {
            return ignoredByEasIgnore;
        }
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
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async getRootPathAsync() {
        return this.projectRoot;
    }
    async isFileIgnoredAsync(filePath) {
        const ignoredByEasIgnore = await isFileIgnoredByEasIgnoreAsync(await this.getRootPathAsync(), filePath);
        if (ignoredByEasIgnore !== undefined) {
            return ignoredByEasIgnore;
        }
        const ignore = new Ignore(this.projectRoot);
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
const EASIGNORE_FILENAME = '.easignore';
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
    async initIgnoreWithEasIgnoreAsync(easIgnoreContent) {
        this.ignoreMapping = [
            ['', (0, ignore_1.default)().add(DEFAULT_IGNORE)],
            ['', (0, ignore_1.default)().add(easIgnoreContent)],
        ];
    }
    async initIgnoreAsync() {
        const ignoreFilePaths = (await (0, glob_1.glob)(`**/${GITIGNORE_FILENAME}`, {
            cwd: this.rootDir,
            ignore: ['node_modules'],
            follow: false,
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
//#endregion - a copy of ignore handler from eas-cli
//# sourceMappingURL=ProjectWorkflow.js.map