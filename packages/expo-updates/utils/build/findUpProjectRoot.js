"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUpProjectRoot = findUpProjectRoot;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function findUpProjectRoot(cwd) {
    if (cwd === path_1.default.sep || cwd === '.') {
        return null;
    }
    for (let dir = cwd; path_1.default.dirname(dir) !== dir; dir = path_1.default.dirname(dir)) {
        const file = path_1.default.resolve(dir, 'package.json');
        if (fs_1.default.existsSync(file)) {
            return dir;
        }
    }
    return null;
}
