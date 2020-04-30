"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Creates file with given content with possible parent directories creation.
 */
async function createDirAndWriteFile(filePath, content) {
    if (!(await fs_extra_1.default.pathExists(path_1.default.dirname(filePath)))) {
        await fs_extra_1.default.mkdirp(path_1.default.dirname(filePath));
    }
    await fs_extra_1.default.writeFile(filePath, content);
}
exports.createDirAndWriteFile = createDirAndWriteFile;
/**
 * Reads given file as UTF-8 with fallback to given content when file is not found.
 */
async function readFileWithFallback(filePath, fallbackContent) {
    if (await fs_extra_1.default.pathExists(filePath)) {
        return fs_extra_1.default.readFile(filePath, 'utf-8');
    }
    if (fallbackContent) {
        return fallbackContent;
    }
    throw Error(`File not found ${filePath}`);
}
exports.readFileWithFallback = readFileWithFallback;
//# sourceMappingURL=file-helpers.js.map