"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeContentsJsonAsync = writeContentsJsonAsync;
// Forked from `@expo/prebuild-config`, because its not exposed as public API or through a correct dependency chain
// See: https://github.com/expo/expo/blob/80ee356c2c90d6498b45c95214ed7be169d63f75/packages/%40expo/prebuild-config/src/plugins/icons/AssetContents.ts
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
async function writeContentsJsonAsync(directory, { images }) {
    const data = {
        images,
        info: {
            version: 1,
            // common practice is for the tool that generated the icons to be the "author"
            author: 'expo',
        },
    };
    await promises_1.default.mkdir(directory, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(directory, 'Contents.json'), JSON.stringify(data, null, 2));
}
