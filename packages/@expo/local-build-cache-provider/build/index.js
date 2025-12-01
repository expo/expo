import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
async function resolveBuildCacheAsync({ projectRoot, platform, fingerprintHash, runOptions }, options = {}) {
    const cacheDir = resolveCacheDir(projectRoot, options);
    if (!fs.existsSync(cacheDir)) {
        console.debug('Local build cache directory does not exist, skipping check');
        return null;
    }
    const files = await fs.promises.readdir(cacheDir);
    const expectedFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}`;
    const file = files.find((file) => file.includes(expectedFile));
    if (!file) {
        console.debug('No matching builds found in local cache, starting build process');
        return null;
    }
    return path.join(cacheDir, file);
}
async function uploadBuildCacheAsync({ projectRoot, platform, fingerprintHash, buildPath, runOptions }, options = {}) {
    const cacheDir = resolveCacheDir(projectRoot, options);
    if (!fs.existsSync(cacheDir)) {
        console.debug('Build cache directory does not exist, creating build cache folder at:', cacheDir);
        await fs.promises.mkdir(cacheDir, { recursive: true });
    }
    try {
        console.log(chalk `{whiteBright \u203A} {bold Copying build to local cache}`);
        const destFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}${path.extname(buildPath)}`;
        const destPath = path.join(cacheDir, destFile);
        // Remove existing cache entry if it exists.
        if (fs.existsSync(destPath)) {
            await fs.promises.rm(destPath, { recursive: true, force: true });
        }
        const stats = await fs.promises.stat(buildPath);
        // iOS builds are usually directories, Android builds are usually files.
        if (stats.isDirectory()) {
            await fs.promises.cp(buildPath, destPath, { recursive: true });
        }
        else if (stats.isFile()) {
            await fs.promises.copyFile(buildPath, destPath);
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
    return options?.cacheDir ?? path.join(projectRoot, '.expo', 'build-cache');
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
export default LocalBuildCacheProvider;
//# sourceMappingURL=index.js.map