"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUpProjectRoot = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function findUpProjectRoot(cwd) {
    if (['.', path_1.default.sep].includes(cwd)) {
        return null;
    }
    if (fs_1.default.existsSync(path_1.default.join(cwd, 'package.json'))) {
        return cwd;
    }
    else {
        return findUpProjectRoot(path_1.default.dirname(cwd));
    }
}
exports.findUpProjectRoot = findUpProjectRoot;
