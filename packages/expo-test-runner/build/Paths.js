"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfPath = void 0;
exports.temporaryDirectory = temporaryDirectory;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
exports.SelfPath = (0, path_1.join)(__dirname, '..');
function temporaryDirectory() {
    const directory = (0, path_1.join)((0, fs_1.realpathSync)((0, os_1.tmpdir)()), (0, crypto_1.randomBytes)(16).toString('hex'));
    (0, fs_1.mkdirSync)(directory);
    return directory;
}
//# sourceMappingURL=Paths.js.map