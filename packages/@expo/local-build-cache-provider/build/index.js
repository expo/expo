"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function resolveBuildCacheAsync({ projectRoot, platform, fingerprintHash, runOptions }, options = {}) {
    const cacheDir = resolveCacheDir(projectRoot, options);
    if (!fs_1.default.existsSync(cacheDir)) {
        console.debug('Local build cache directory does not exist, skipping check');
        return null;
    }
    const files = await fs_1.default.promises.readdir(cacheDir);
    const expectedFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}`;
    const file = files.find((file) => file.includes(expectedFile));
    if (!file) {
        console.debug('No matching builds found in local cache, starting build process');
        return null;
    }
    return path_1.default.join(cacheDir, file);
}
async function uploadBuildCacheAsync({ projectRoot, platform, fingerprintHash, buildPath, runOptions }, options = {}) {
    const cacheDir = resolveCacheDir(projectRoot, options);
    if (!fs_1.default.existsSync(cacheDir)) {
        console.debug('Build cache directory does not exist, creating build cache folder at:', cacheDir);
        await fs_1.default.promises.mkdir(cacheDir, { recursive: true });
    }
    try {
        console.log((0, chalk_1.default) `{whiteBright \u203A} {bold Copying build to local cache}`);
        const destFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}${path_1.default.extname(buildPath)}`;
        const destPath = path_1.default.join(cacheDir, destFile);
        // Remove existing cache entry if it exists.
        if (fs_1.default.existsSync(destPath)) {
            await fs_1.default.promises.rm(destPath, { recursive: true, force: true });
        }
        const stats = await fs_1.default.promises.stat(buildPath);
        // iOS builds are usually directories, Android builds are usually files.
        if (stats.isDirectory()) {
            await fs_1.default.promises.cp(buildPath, destPath, { recursive: true });
        }
        else if (stats.isFile()) {
            await fs_1.default.promises.copyFile(buildPath, destPath);
        }
        else {
            console.debug('Unsupported build artifact type for caching:', buildPath);
            return null;
        }
        return destPath;
    }
    catch (error) {
        console.debug(' error:', error);
    }
    return null;
}
function resolveCacheDir(projectRoot, options) {
    return options?.cacheDir ?? path_1.default.join(projectRoot, '.expo', 'build-cache');
}
function getBuildVariant(runOptions) {
    if ('variant' in runOptions && runOptions.variant !== undefined) {
        return runOptions.variant;
    }
    if ('configuration' in runOptions && runOptions.configuration !== undefined) {
        return runOptions.configuration;
    }
    return 'unknown';
}
const LocalBuildCacheProvider = {
    resolveBuildCache: resolveBuildCacheAsync,
    uploadBuildCache: uploadBuildCacheAsync,
};
exports.default = LocalBuildCacheProvider;
//# sourceMappingURL=index.js.map