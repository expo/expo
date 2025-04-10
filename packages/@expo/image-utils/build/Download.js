"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadOrUseCachedImage = downloadOrUseCachedImage;
exports.downloadImage = downloadImage;
const fs_1 = __importDefault(require("fs"));
// @ts-ignore
const jimp_compact_1 = __importDefault(require("jimp-compact"));
const path_1 = __importDefault(require("path"));
const stream_1 = __importDefault(require("stream"));
const temp_dir_1 = __importDefault(require("temp-dir"));
const unique_string_1 = __importDefault(require("unique-string"));
const util_1 = __importDefault(require("util"));
// cache downloaded images into memory
const cacheDownloadedKeys = {};
function stripQueryParams(url) {
    return url.split('?')[0].split('#')[0];
}
function temporaryDirectory() {
    const directory = path_1.default.join(temp_dir_1.default, (0, unique_string_1.default)());
    fs_1.default.mkdirSync(directory, { recursive: true });
    return directory;
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
async function downloadImage(url) {
    const outputPath = temporaryDirectory();
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`It was not possible to download image from '${url}'`);
    }
    if (!response.body) {
        throw new Error(`No response received from '${url}'`);
    }
    // Download to local file
    const streamPipeline = util_1.default.promisify(stream_1.default.pipeline);
    const localPath = path_1.default.join(outputPath, path_1.default.basename(stripQueryParams(url)));
    // Type casting is required, see: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
    const readableBody = stream_1.default.Readable.fromWeb(response.body);
    await streamPipeline(readableBody, fs_1.default.createWriteStream(localPath));
    // If an image URL doesn't have a name, get the mime type and move the file.
    const img = await jimp_compact_1.default.read(localPath);
    const mime = img.getMIME().split('/').pop();
    if (!localPath.endsWith(mime)) {
        const newPath = path_1.default.join(outputPath, `image.${mime}`);
        const parentPath = path_1.default.dirname(newPath);
        if (!fs_1.default.existsSync(parentPath)) {
            await fs_1.default.promises.mkdir(parentPath, { recursive: true });
        }
        // NOTE: EXDEV can't happen since we're just renaming the file in the same directory
        await fs_1.default.promises.rename(localPath, newPath);
        return newPath;
    }
    return localPath;
}
//# sourceMappingURL=Download.js.map