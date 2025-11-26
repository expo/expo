import { getPackageJson, } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
async function resolveBuildCacheAsync({ projectRoot, platform, fingerprintHash, runOptions }, options = {}) {
    const cacheDir = options?.cacheDir ?? path.join(projectRoot, '.expo', 'build-cache');
    if (!fs.existsSync(cacheDir)) {
        console.debug('Local build cache directory does not exist, skipping check');
        return null;
    }
    const expectedFile = `${platform}-${fingerprintHash}${isDevClientBuild({ runOptions, projectRoot }) ? '-dev-client' : ''}`;
    const files = fs.readdirSync(cacheDir);
    const file = files.find((file) => file.includes(expectedFile));
    if (!file) {
        console.debug('No matching builds found in local cache, starting build process');
        return null;
    }
    return path.join(cacheDir, file);
}
async function uploadBuildCacheAsync({ projectRoot, platform, fingerprintHash, buildPath, runOptions }, options = {}) {
    const cacheDir = options?.cacheDir ?? path.join(projectRoot, '.expo', 'build-cache');
    if (!fs.existsSync(cacheDir)) {
        console.debug('Build cache directory does not exist, creating build cache folder at:', cacheDir);
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    try {
        console.log(chalk `{whiteBright \u203A} {bold Copying build to local cache}`);
        const destFile = `${platform}-${fingerprintHash}${isDevClientBuild({ runOptions, projectRoot }) ? '-dev-client' : ''}${path.extname(buildPath)}`;
        const destPath = path.join(cacheDir, destFile);
        // Remove existing cache entry if it exists.
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
        }
        const stats = fs.statSync(buildPath);
        // iOS builds are usually directories, Android builds are usually files.
        if (stats.isDirectory()) {
            fs.cpSync(buildPath, destPath, { recursive: true });
        }
        else if (stats.isFile()) {
            fs.copyFileSync(buildPath, destPath);
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
function isDevClientBuild({ runOptions, projectRoot, }) {
    if (!hasDirectDevClientDependency(projectRoot)) {
        return false;
    }
    if ('variant' in runOptions && runOptions.variant !== undefined) {
        return runOptions.variant === 'debug';
    }
    if ('configuration' in runOptions && runOptions.configuration !== undefined) {
        return runOptions.configuration === 'Debug';
    }
    return true;
}
function hasDirectDevClientDependency(projectRoot) {
    const { dependencies = {}, devDependencies = {} } = getPackageJson(projectRoot);
    return !!dependencies['expo-dev-client'] || !!devDependencies['expo-dev-client'];
}
const LocalBuildCacheProvider = {
    resolveBuildCache: resolveBuildCacheAsync,
    uploadBuildCache: uploadBuildCacheAsync,
};
export default LocalBuildCacheProvider;
//# sourceMappingURL=index.js.map