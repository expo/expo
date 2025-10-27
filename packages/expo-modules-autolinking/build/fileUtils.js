"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExistsAsync = fileExistsAsync;
exports.globMatchFunctorAllAsync = globMatchFunctorAllAsync;
exports.globMatchFunctorFirstAsync = globMatchFunctorFirstAsync;
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
/**
 * Check if the file exists.
 */
async function fileExistsAsync(file) {
    return (await promises_1.default.stat(file).catch(() => null))?.isFile() ?? false;
}
/**
 * Search files that match the glob pattern and return all matches from the matchFunctor.
 */
async function globMatchFunctorAllAsync(globPattern, matchFunctor, options) {
    const globStream = glob_1.glob.stream(globPattern, {
        ...options,
        withFileTypes: true,
    });
    const cwd = options?.cwd !== undefined ? `${options.cwd}` : process.cwd();
    const results = [];
    for await (const globPath of globStream) {
        if (!globPath.isFile()) {
            continue;
        }
        let filePath = globPath.fullpath();
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
/**
 * Search files that match the glob pattern and return the first match from the matchFunctor.
 */
async function globMatchFunctorFirstAsync(globPattern, matchFunctor, options) {
    const globStream = glob_1.glob.stream(globPattern, {
        ...options,
        withFileTypes: true,
    });
    const cwd = options?.cwd !== undefined ? `${options.cwd}` : process.cwd();
    for await (const globPath of globStream) {
        if (!globPath.isFile()) {
            continue;
        }
        let filePath = globPath.fullpath();
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
//# sourceMappingURL=fileUtils.js.map