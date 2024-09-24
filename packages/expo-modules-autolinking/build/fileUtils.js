"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globMatchFunctorFirstAsync = exports.globMatchFunctorAllAsync = exports.fileExistsAsync = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Check if the file exists.
 */
async function fileExistsAsync(file) {
    return (await promises_1.default.stat(file).catch(() => null))?.isFile() ?? false;
}
exports.fileExistsAsync = fileExistsAsync;
/**
 * Search files that match the glob pattern and return all matches from the matchFunctor.
 */
async function globMatchFunctorAllAsync(globPattern, matchFunctor, options) {
    const globStream = fast_glob_1.default.stream(globPattern, options);
    const cwd = options?.cwd ?? process.cwd();
    const results = [];
    for await (const file of globStream) {
        let filePath = file.toString();
        if (!path_1.default.isAbsolute(filePath)) {
            filePath = path_1.default.resolve(cwd, filePath);
        }
        const contents = await promises_1.default.readFile(filePath);
        const matched = matchFunctor(filePath, contents);
        if (matched != null) {
            results.push(matched);
        }
    }
    return results;
}
exports.globMatchFunctorAllAsync = globMatchFunctorAllAsync;
/**
 * Search files that match the glob pattern and return the first match from the matchFunctor.
 */
async function globMatchFunctorFirstAsync(globPattern, matchFunctor, options) {
    const globStream = fast_glob_1.default.stream(globPattern, options);
    const cwd = options?.cwd ?? process.cwd();
    for await (const file of globStream) {
        let filePath = file.toString();
        if (!path_1.default.isAbsolute(filePath)) {
            filePath = path_1.default.resolve(cwd, filePath);
        }
        const contents = await promises_1.default.readFile(filePath);
        const matched = matchFunctor(filePath, contents);
        if (matched != null) {
            return matched;
        }
    }
    return null;
}
exports.globMatchFunctorFirstAsync = globMatchFunctorFirstAsync;
//# sourceMappingURL=fileUtils.js.map