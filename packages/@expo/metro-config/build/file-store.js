"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const FileStore_1 = __importDefault(require("@expo/metro/metro-cache/stores/FileStore"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const debug = require('debug')('expo:metro:cache');
// On macOS `os.tmpdir()` returns `/var/folders/...` while its realpath is
// `/private/var/folders/...`; accept either form so callers that resolved
// symlinks aren't excluded.
function isInsideOsTmpdir(target) {
    const resolved = path_1.default.resolve(target);
    const tmp = path_1.default.resolve(os_1.default.tmpdir());
    if (resolved !== tmp && resolved.startsWith(tmp + path_1.default.sep)) {
        return true;
    }
    let tmpReal;
    try {
        tmpReal = fs_1.default.realpathSync(tmp);
    }
    catch {
        return false;
    }
    return resolved !== tmpReal && resolved.startsWith(tmpReal + path_1.default.sep);
}
// Renames `root` to a sibling tombstone and deletes it in the background.
// Returns false if the caller should fall back to a synchronous remove.
// `maxRetries` covers the Windows case where files just closed can briefly
// fail to delete with EBUSY/EPERM.
function tryRenameAndDeleteAsync(root) {
    if (!isInsideOsTmpdir(root)) {
        return false;
    }
    const tombstone = `${root}.delete-${process.pid}-${Date.now()}`;
    try {
        fs_1.default.renameSync(root, tombstone);
    }
    catch (err) {
        if (err?.code === 'ENOENT') {
            return true;
        }
        debug('Cache rename failed, falling back to recursive remove:', err);
        return false;
    }
    fs_1.default.promises.rm(tombstone, { recursive: true, force: true, maxRetries: 3 }).catch((err) => {
        debug('Failed to remove cache tombstone:', tombstone, err);
    });
    return true;
}
class FileStore extends FileStore_1.default {
    _root;
    constructor(options) {
        super(options);
        this._root = options.root;
    }
    async set(key, value) {
        // Prevent caching of CSS files that have the skipCache flag set.
        if (value?.output?.[0]?.data?.css?.skipCache) {
            debug('Skipping caching for CSS file:', value.path);
            return;
        }
        return await super.set(key, value);
    }
    clear() {
        if (!tryRenameAndDeleteAsync(this._root)) {
            super.clear();
        }
    }
}
exports.FileStore = FileStore;
//# sourceMappingURL=file-store.js.map