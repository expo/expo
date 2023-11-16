"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeContentsJsonAsync = exports.createContentsJsonItem = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
function createContentsJsonItem(item) {
    return item;
}
exports.createContentsJsonItem = createContentsJsonItem;
/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
async function writeContentsJsonAsync(directory, { images }) {
    await fs_extra_1.default.ensureDir(directory);
    await fs_extra_1.default.writeFile((0, path_1.join)(directory, 'Contents.json'), JSON.stringify({
        images,
        info: {
            version: 1,
            // common practice is for the tool that generated the icons to be the "author"
            author: 'expo',
        },
    }, null, 2));
}
exports.writeContentsJsonAsync = writeContentsJsonAsync;
