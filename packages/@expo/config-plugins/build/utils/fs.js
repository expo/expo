"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFile = exports.copyFilePathToPathAsync = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** A basic function that copies a single file to another file location. */
async function copyFilePathToPathAsync(src, dest) {
    const srcFile = await fs_1.default.promises.readFile(src);
    await fs_1.default.promises.mkdir(path_1.default.dirname(dest), { recursive: true });
    await fs_1.default.promises.writeFile(dest, srcFile);
}
exports.copyFilePathToPathAsync = copyFilePathToPathAsync;
/** Remove a single file (not directory). Returns `true` if a file was actually deleted. */
function removeFile(filePath) {
    try {
        fs_1.default.unlinkSync(filePath);
        return true;
    }
    catch (error) {
        // Skip if the remove did nothing.
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}
exports.removeFile = removeFile;
