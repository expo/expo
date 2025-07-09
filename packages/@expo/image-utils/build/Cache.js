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
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const CACHE_LOCATION = '.expo/web/cache/production/images';
const cacheKeys = {};
// Calculate SHA256 Checksum value of a file based on its contents
function calculateHash(filePath) {
    const contents = filePath.startsWith('http') ? filePath : fs_1.default.readFileSync(filePath);
    return crypto_1.default.createHash('sha256').update(contents).digest('hex');
}
// Create a hash key for caching the images between builds
function createCacheKey(fileSource, properties) {
    const hash = calculateHash(fileSource);
    return [hash].concat(properties).filter(Boolean).join('-');
}
async function createCacheKeyWithDirectoryAsync(projectRoot, type, icon) {
    const iconProperties = [icon.resizeMode];
    if (icon.backgroundColor) {
        iconProperties.push(icon.backgroundColor);
    }
    const cacheKey = `${type}-${createCacheKey(icon.src, iconProperties)}`;
    if (!(cacheKey in cacheKeys)) {
        cacheKeys[cacheKey] = await ensureCacheDirectory(projectRoot, type, cacheKey);
    }
    return cacheKey;
}
async function ensureCacheDirectory(projectRoot, type, cacheKey) {
    const cacheFolder = (0, path_1.join)(projectRoot, CACHE_LOCATION, type, cacheKey);
    await fs_1.default.promises.mkdir(cacheFolder, { recursive: true });
    return cacheFolder;
}
async function getImageFromCacheAsync(fileName, cacheKey) {
    try {
        return await fs_1.default.promises.readFile((0, path_1.resolve)(cacheKeys[cacheKey], fileName));
    }
    catch {
        return null;
    }
}
async function cacheImageAsync(fileName, buffer, cacheKey) {
    try {
        await fs_1.default.promises.writeFile((0, path_1.resolve)(cacheKeys[cacheKey], fileName), buffer);
    }
    catch (error) {
        console.warn(`Error caching image: "${fileName}". ${error.message}`);
    }
}
async function clearUnusedCachesAsync(projectRoot, type) {
    // Clean up any old caches
    const cacheFolder = (0, path_1.join)(projectRoot, CACHE_LOCATION, type);
    await fs_1.default.promises.mkdir(cacheFolder, { recursive: true });
    const currentCaches = await fs_1.default.promises.readdir(cacheFolder);
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
            deleteCachePromises.push(fs_1.default.promises.rm((0, path_1.join)(cacheFolder, cache), { force: true, recursive: true }));
        }
    }
    await Promise.all(deleteCachePromises);
}
//# sourceMappingURL=Cache.js.map