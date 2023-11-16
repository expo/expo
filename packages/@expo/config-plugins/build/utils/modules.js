"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExists = exports.directoryExistsAsync = exports.fileExistsAsync = void 0;
const fs_1 = __importDefault(require("fs"));
/**
 * A non-failing version of async FS stat.
 *
 * @param file
 */
async function statAsync(file) {
    try {
        return await fs_1.default.promises.stat(file);
    }
    catch {
        return null;
    }
}
async function fileExistsAsync(file) {
    return (await statAsync(file))?.isFile() ?? false;
}
exports.fileExistsAsync = fileExistsAsync;
async function directoryExistsAsync(file) {
    return (await statAsync(file))?.isDirectory() ?? false;
}
exports.directoryExistsAsync = directoryExistsAsync;
function fileExists(file) {
    try {
        return fs_1.default.statSync(file).isFile();
    }
    catch {
        return false;
    }
}
exports.fileExists = fileExists;
