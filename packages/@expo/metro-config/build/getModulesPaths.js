"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesPaths = exports.getWorkspaceRoot = void 0;
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const path_1 = __importDefault(require("path"));
/** Wraps `findWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
function getWorkspaceRoot(projectRoot) {
    try {
        return (0, find_yarn_workspace_root_1.default)(projectRoot);
    }
    catch (error) {
        if (error.message.includes('Unexpected end of JSON input')) {
            return null;
        }
        throw error;
    }
}
exports.getWorkspaceRoot = getWorkspaceRoot;
function getModulesPaths(projectRoot) {
    const paths = [];
    // Only add the project root if it's not the current working directory
    // this minimizes the chance of Metro resolver breaking on new Node.js versions.
    const workspaceRoot = getWorkspaceRoot(path_1.default.resolve(projectRoot)); // Absolute path or null
    if (workspaceRoot) {
        paths.push(path_1.default.resolve(projectRoot));
        paths.push(path_1.default.resolve(workspaceRoot, 'node_modules'));
    }
    return paths;
}
exports.getModulesPaths = getModulesPaths;
//# sourceMappingURL=getModulesPaths.js.map