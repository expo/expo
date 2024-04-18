"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheKey = createCacheKey;
exports.createCacheKeyWithDirectoryAsync = createCacheKeyWithDirectoryAsync;
exports.ensureCacheDirectory = ensureCacheDirectory;
exports.getImageFromCacheAsync = getImageFromCacheAsync;
exports.cacheImageAsync = cacheImageAsync;
exports.clearUnusedCachesAsync = clearUnusedCachesAsync;
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const CACHE_LOCATION = '.expo/web/cache/production/images';
const cacheKeys = {};
// Calculate SHA256 Checksum value of a file based on its contents
function calculateHash(filePath) {
    const contents = filePath.startsWith('http') ? filePath : (0, fs_extra_1.readFileSync)(filePath);
    return crypto_1.default.createHash('sha256').update(contents).digest('hex');
}
// Create a hash key for caching the images between builds
function createCacheKey(fileSource, properties) {
    const hash = calculateHash(fileSource);
    return [hash].concat(properties).filter(Boolean).join('-');
}
async function createCacheKeyWithDirectoryAsync(projectRoot, type, icon) {
    const cacheKey = `${type}-${createCacheKey(icon.src, [icon.resizeMode, icon.backgroundColor])}`;
    if (!(cacheKey in cacheKeys)) {
        cacheKeys[cacheKey] = await ensureCacheDirectory(projectRoot, type, cacheKey);
    }
    return cacheKey;
}
async function ensureCacheDirectory(projectRoot, type, cacheKey) {
    const cacheFolder = (0, path_1.join)(projectRoot, CACHE_LOCATION, type, cacheKey);
    await (0, fs_extra_1.ensureDir)(cacheFolder);
    return cacheFolder;
}
async function getImageFromCacheAsync(fileName, cacheKey) {
    try {
        return await (0, fs_extra_1.readFile)((0, path_1.resolve)(cacheKeys[cacheKey], fileName));
    }
    catch {
        return null;
    }
}
async function cacheImageAsync(fileName, buffer, cacheKey) {
    try {
        await (0, fs_extra_1.writeFile)((0, path_1.resolve)(cacheKeys[cacheKey], fileName), buffer);
    }
    catch (error) {
        console.warn(`Error caching image: "${fileName}". ${error.message}`);
    }
}
async function clearUnusedCachesAsync(projectRoot, type) {
    // Clean up any old caches
    const cacheFolder = (0, path_1.join)(projectRoot, CACHE_LOCATION, type);
    await (0, fs_extra_1.ensureDir)(cacheFolder);
    const currentCaches = (0, fs_extra_1.readdirSync)(cacheFolder);
    if (!Array.isArray(currentCaches)) {
        console.warn('Failed to read the icon cache');
        return;
    }
    const deleteCachePromises = [];
    for (const cache of currentCaches) {
        // skip hidden folders
        if (cache.startsWith('.')) {
            continue;
        }
        // delete
        if (!(cache in cacheKeys)) {
            deleteCachePromises.push((0, fs_extra_1.remove)((0, path_1.join)(cacheFolder, cache)));
        }
    }
    await Promise.all(deleteCachePromises);
}
//# sourceMappingURL=Cache.js.map