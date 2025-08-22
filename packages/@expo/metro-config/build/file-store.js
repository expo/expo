"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const FileStore_1 = __importDefault(require("@expo/metro/metro-cache/stores/FileStore"));
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
//# sourceMappingURL=file-store.js.map