"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveAsync = exports.ensureDirectoryAsync = exports.directoryExistsAsync = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function directoryExistsAsync(file) {
    return (await fs_1.default.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}
exports.directoryExistsAsync = directoryExistsAsync;
async function ensureDirectoryAsync(path) {
    await fs_1.default.promises.mkdir(path, { recursive: true });
}
exports.ensureDirectoryAsync = ensureDirectoryAsync;
async function moveAsync(src, dest) {
    // First, remove target, so there are no conflicts (explicit overwrite)
    await fs_1.default.promises.rm(dest, { force: true, recursive: true });
    // Then, make sure that the target parent directory exists
    await fs_1.default.promises.mkdir(path_1.default.dirname(dest), { recursive: true });
    try {
        // Then, rename the file to move it to the destination
        await fs_1.default.promises.rename(src, dest);
    }
    catch (error) {
        if (error.code === 'EXDEV') {
            // If the file is on a different device/disk, copy it instead and delete the original
            await fs_1.default.promises.cp(src, dest, { errorOnExist: true, recursive: true });
            await fs_1.default.promises.rm(src, { recursive: true, force: true });
        }
        else {
            throw error;
        }
    }
}
exports.moveAsync = moveAsync;
//# sourceMappingURL=dir.js.map