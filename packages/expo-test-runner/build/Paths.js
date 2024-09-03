"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.temporaryDirectory = exports.SelfPath = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const temp_dir_1 = __importDefault(require("temp-dir"));
const unique_string_1 = __importDefault(require("unique-string"));
exports.SelfPath = (0, path_1.join)(__dirname, '..');
function temporaryDirectory() {
    const directory = (0, path_1.join)(temp_dir_1.default, (0, unique_string_1.default)());
    (0, fs_1.mkdirSync)(directory);
    return directory;
}
exports.temporaryDirectory = temporaryDirectory;
//# sourceMappingURL=Paths.js.map