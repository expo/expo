"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileBasedHashSourceAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function getFileBasedHashSourceAsync(projectRoot, filePath, reason) {
    let result = null;
    try {
        const stat = await promises_1.default.stat(path_1.default.join(projectRoot, filePath));
        result = {
            type: stat.isDirectory() ? 'dir' : 'file',
            filePath,
            reasons: [reason],
        };
    }
    catch {
        result = null;
    }
    return result;
}
exports.getFileBasedHashSourceAsync = getFileBasedHashSourceAsync;
//# sourceMappingURL=Utils.js.map