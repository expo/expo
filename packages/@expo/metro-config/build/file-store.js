"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorFileStore = exports.FileStore = void 0;
const FileStore_1 = __importDefault(require("metro-cache/src/stores/FileStore"));
const env_1 = require("./env");
const debug = require('debug')('expo:metro:cache');
class FileStore extends FileStore_1.default {
    async set(key, value) {
        // Prevent caching of CSS files that have the skipCache flag set.
        if (value?.output?.[0]?.data?.css?.skipCache) {
            debug('Skipping caching for CSS file:', value.path);
            return;
        }
        return await super.set(key, value);
    }
}
exports.FileStore = FileStore;
class VendorFileStore extends FileStore_1.default {
    clear() {
        if (!env_1.env.__EXPO_SEED_CACHE) {
            return;
        }
        console.warn('CLEARING VENDOR CACHE');
        return super.clear();
    }
    async set(key, value) {
        if (!env_1.env.__EXPO_SEED_CACHE) {
            return;
        }
        return await super.set(key, value);
    }
}
exports.VendorFileStore = VendorFileStore;
//# sourceMappingURL=file-store.js.map