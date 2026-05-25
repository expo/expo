"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const FileStore_1 = __importDefault(require("@expo/metro/metro-cache/stores/FileStore"));
const msgpackr_1 = require("msgpackr");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const file_store_1 = require("./file-store");
const { pid } = process;
const debug = require('debug')('expo:metro:cache');
/** Pre-create shard directories all at once as a preflight task */
function ensureShardDirs(root) {
    const tasks = [];
    for (let i = 0; i < 256; i++) {
        const shard = ('0' + i.toString(16)).slice(-2);
        tasks.push(node_fs_1.default.promises.mkdir(node_path_1.default.join(root, shard), { recursive: true }));
    }
    return Promise.all(tasks).then(() => undefined);
}
async function renameWithRetry(from, to) {
    try {
        await node_fs_1.default.promises.rename(from, to);
    }
    catch (err) {
        if (err?.code !== 'EPERM' && err?.code !== 'EBUSY')
            throw err;
        await new Promise((resolve) => setTimeout(resolve, 50));
        await node_fs_1.default.promises.rename(from, to);
    }
}
const getTmpName = (name) => `.tmp${pid}_${name}`;
class BinaryFileStore extends FileStore_1.default {
    #root;
    #prepare;
    #packr = new msgpackr_1.Packr({
        useRecords: true,
        moreTypes: true,
        // NOTE(@kitten): Experimentally validated to help performance with our cache file format
        bundleStrings: true,
    });
    constructor(options) {
        super(options);
        this.#root = node_path_1.default.resolve(options.root);
    }
    prepare() {
        if (!this.#prepare) {
            this.#prepare = ensureShardDirs(this.#root);
        }
        return this.#prepare;
    }
    async get(key) {
        const filePath = this.#getFileDir(key) + node_path_1.default.sep + this.#getFileName(key);
        let data;
        try {
            data = await node_fs_1.default.promises.readFile(filePath);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
        try {
            return this.#packr.decode(data);
        }
        catch (err) {
            node_fs_1.default.promises.unlink(filePath).catch(() => { });
            return null;
        }
    }
    async set(key, value) {
        // Prevent caching of CSS files that have the skipCache flag set.
        if (value?.output?.[0]?.data?.css?.skipCache) {
            debug('Skipping caching for CSS file:', value.path);
            return;
        }
        const buffer = this.#packr.encode(value);
        await this.prepare();
        const fileDir = this.#getFileDir(key);
        const fileName = this.#getFileName(key);
        const targetTemp = fileDir + node_path_1.default.sep + getTmpName(fileName);
        const targetPath = fileDir + node_path_1.default.sep + fileName;
        let renamed = false;
        try {
            await node_fs_1.default.promises.writeFile(targetTemp, buffer);
            await renameWithRetry(targetTemp, targetPath);
            renamed = true;
        }
        catch (err) {
            // The cache root can disappear underneath us if a parallel process clears the cache root
            if (err?.code !== 'ENOENT')
                throw err;
            this.#prepare = undefined;
            await this.prepare();
            await node_fs_1.default.promises.writeFile(targetTemp, buffer);
            await renameWithRetry(targetTemp, targetPath);
            renamed = true;
        }
        finally {
            if (!renamed)
                await node_fs_1.default.promises.unlink(targetTemp).catch(() => { });
        }
    }
    clear() {
        this.#prepare = undefined;
        if (!(0, file_store_1.tryRenameAndDeleteAsync)(this.#root)) {
            super.clear();
        }
    }
    #getFileDir(key) {
        return this.#root + node_path_1.default.sep + key.subarray(0, 1).toString('hex');
    }
    #getFileName(key) {
        return key.subarray(1).toString('hex') + '.mp';
    }
}
exports.FileStore = BinaryFileStore;
//# sourceMappingURL=binary-file-store.js.map