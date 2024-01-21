"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveAsync = exports.ensureDirectoryAsync = exports.directoryExistsAsync = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
async function directoryExistsAsync(file) {
    return (await fs_extra_1.default.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}
exports.directoryExistsAsync = directoryExistsAsync;
const ensureDirectoryAsync = (path) => fs_extra_1.default.promises.mkdir(path, { recursive: true });
exports.ensureDirectoryAsync = ensureDirectoryAsync;
exports.moveAsync = fs_extra_1.default.move;
//# sourceMappingURL=dir.js.map