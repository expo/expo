"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirAsync = ensureDirAsync;
const fs_1 = require("fs");
function ensureDirAsync(path) {
    return fs_1.promises.mkdir(path, { recursive: true });
}
