"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAsync = exports.createWorkingDirectoriesAsync = void 0;
const assert_1 = __importDefault(require("assert"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const dir_1 = require("./dir");
const WORKING_DIR_ROOT = '.patch-project-tmp';
/**
 * Create working directories for the patch-project process.
 */
async function createWorkingDirectoriesAsync(projectRoot, platform) {
    // We put the temporary working directories inside the project root so moving files is fast.
    const rootDir = path_1.default.join(projectRoot, WORKING_DIR_ROOT, platform);
    await promises_1.default.rm(rootDir, { recursive: true, force: true });
    return {
        rootDir: await ensureAsync(rootDir),
        templateDir: await ensureAsync(path_1.default.join(rootDir, 'template')),
        diffDir: await ensureAsync(path_1.default.join(rootDir, 'diff')),
        originDir: await ensureAsync(path_1.default.join(rootDir, 'origin')),
        tmpDir: await ensureAsync(path_1.default.join(rootDir, 'tmp')),
    };
}
exports.createWorkingDirectoriesAsync = createWorkingDirectoriesAsync;
async function ensureAsync(path) {
    const result = await (0, dir_1.ensureDirectoryAsync)(path);
    (0, assert_1.default)(result, 'The return value should be string when recursive is true');
    return result;
}
exports.ensureAsync = ensureAsync;
//# sourceMappingURL=workingDirectories.js.map