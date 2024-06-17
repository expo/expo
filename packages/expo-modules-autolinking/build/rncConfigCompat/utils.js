"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExistsAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
/**
 * Check if the file exists.
 */
async function fileExistsAsync(file) {
    return (await promises_1.default.stat(file).catch(() => null))?.isFile() ?? false;
}
exports.fileExistsAsync = fileExistsAsync;
//# sourceMappingURL=utils.js.map