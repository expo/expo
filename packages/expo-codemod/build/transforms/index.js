"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSFORM_DIR = void 0;
exports.listTransformsAsync = listTransformsAsync;
exports.transformFilePath = transformFilePath;
const path_1 = __importDefault(require("path"));
const tinyglobby_1 = require("tinyglobby");
exports.TRANSFORM_DIR = __dirname;
async function listTransformsAsync() {
    // *.js, since this function will be called from within build folder
    const modules = await (0, tinyglobby_1.glob)(['*.js'], { cwd: exports.TRANSFORM_DIR });
    return modules
        .map((filename) => path_1.default.basename(filename, '.js'))
        .filter((name) => name !== 'index')
        .sort();
}
function transformFilePath(transform) {
    return path_1.default.join(exports.TRANSFORM_DIR, `${transform}.js`);
}
//# sourceMappingURL=index.js.map