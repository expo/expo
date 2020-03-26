"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
function getExpoRepositoryRootDir() {
    // EXPO_ROOT_DIR is set locally by direnv
    return process.env.EXPO_ROOT_DIR || path_1.join(__dirname, '..');
}
exports.getExpoRepositoryRootDir = getExpoRepositoryRootDir;
//# sourceMappingURL=Utils.js.map