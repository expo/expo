"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskAll = void 0;
exports.scanFilesRecursively = scanFilesRecursively;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// TODO(@HubertBer): Also exists in expo-modules-autolinking, but with a limiter, maybe take it or depend on it?
const taskAll = (inputs, map) => {
    return Promise.all(inputs.map(map));
};
exports.taskAll = taskAll;
// TODO(@HubertBer): Taken from expo-modules-autolinking, maybe import it instead?
async function* scanFilesRecursively(parentPath, includeDirectory, sort = !fs_1.default.promises.opendir) {
    const queue = [parentPath];
    let targetPath;
    while (queue.length > 0 && (targetPath = queue.shift()) != null) {
        try {
            const entries = sort
                ? (await fs_1.default.promises.readdir(targetPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
                : await fs_1.default.promises.opendir(targetPath);
            for await (const entry of entries) {
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    if (!includeDirectory || includeDirectory(targetPath, entry.name)) {
                        queue.push(path_1.default.join(targetPath, entry.name));
                    }
                }
                else if (entry.isFile()) {
                    yield {
                        path: path_1.default.join(targetPath, entry.name),
                        parentPath: targetPath,
                        name: entry.name,
                    };
                }
            }
        }
        catch {
            continue;
        }
    }
}
//# sourceMappingURL=utils.js.map