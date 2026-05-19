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
        this.#root = options.root;
    }
    prepare() {
        if (!this.#prepare) {
            this.#prepare = ensureShardDirs(this.#root);
        }
        return this.#prepare;
    }
    async get(key) {
        let data;
        try {
            data = await node_fs_1.default.promises.readFile(this.#getFilePath(key));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
        return this.#packr.decode(data);
    }
    async set(key, value) {
        // Prevent caching of CSS files that have the skipCache flag set.
        if (value?.output?.[0]?.data?.css?.skipCache) {
            debug('Skipping caching for CSS file:', value.path);
            return;
        }
        const buffer = this.#packr.encode(value);
        await this.prepare();
        const filePath = this.#getFilePath(key);
        try {
            await node_fs_1.default.promises.writeFile(filePath, buffer);
        }
        catch (err) {
            // The cache root can disappear underneath us if a parallel process clears the cache root
            if (err?.code !== 'ENOENT')
                throw err;
            this.#prepare = undefined;
            await this.prepare();
            await node_fs_1.default.promises.writeFile(filePath, buffer);
        }
    }
    clear() {
        this.#prepare = undefined;
        if (!(0, file_store_1.tryRenameAndDeleteAsync)(this.#root)) {
            super.clear();
        }
    }
    #getFilePath(key) {
        return node_path_1.default.join(this.#root, key.subarray(0, 1).toString('hex'), key.subarray(1).toString('hex') + '.mp');
    }
}
exports.FileStore = BinaryFileStore;
//# sourceMappingURL=binary-file-store.js.map