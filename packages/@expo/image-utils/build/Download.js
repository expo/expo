"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadImage = exports.downloadOrUseCachedImage = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
// @ts-ignore
const jimp_compact_1 = __importDefault(require("jimp-compact"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const stream_1 = __importDefault(require("stream"));
const tempy_1 = __importDefault(require("tempy"));
const util_1 = __importDefault(require("util"));
// cache downloaded images into memory
const cacheDownloadedKeys = {};
function stripQueryParams(url) {
    return url.split('?')[0].split('#')[0];
}
async function downloadOrUseCachedImage(url) {
    if (url in cacheDownloadedKeys) {
        return cacheDownloadedKeys[url];
    }
    if (url.startsWith('http')) {
        cacheDownloadedKeys[url] = await downloadImage(url);
    }
    else {
        cacheDownloadedKeys[url] = url;
    }
    return cacheDownloadedKeys[url];
}
exports.downloadOrUseCachedImage = downloadOrUseCachedImage;
async function downloadImage(url) {
    const outputPath = tempy_1.default.directory();
    const response = await (0, node_fetch_1.default)(url);
    if (!response.ok) {
        throw new Error(`It was not possible to download image from '${url}'`);
    }
    // Download to local file
    const streamPipeline = util_1.default.promisify(stream_1.default.pipeline);
    const localPath = path_1.default.join(outputPath, path_1.default.basename(stripQueryParams(url)));
    await streamPipeline(response.body, fs_extra_1.default.createWriteStream(localPath));
    // If an image URL doesn't have a name, get the mime type and move the file.
    const img = await jimp_compact_1.default.read(localPath);
    const mime = img.getMIME().split('/').pop();
    if (!localPath.endsWith(mime)) {
        const newPath = path_1.default.join(outputPath, `image.${mime}`);
        await fs_extra_1.default.move(localPath, newPath);
        return newPath;
    }
    return localPath;
}
exports.downloadImage = downloadImage;
//# sourceMappingURL=Download.js.map