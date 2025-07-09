"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesPaths = getModulesPaths;
const paths_1 = require("@expo/config/paths");
const path_1 = __importDefault(require("path"));
function getModulesPaths(projectRoot) {
    const paths = [];
    // Only add the project root if it's not the current working directory
    // this minimizes the chance of Metro resolver breaking on new Node.js versions.
    const resolvedProjectRoot = path_1.default.resolve(projectRoot);
    const workspaceRoot = (0, paths_1.getMetroServerRoot)(resolvedProjectRoot);
    if (workspaceRoot !== resolvedProjectRoot) {
        paths.push(path_1.default.resolve(projectRoot, 'node_modules'));
        paths.push(path_1.default.resolve(workspaceRoot, 'node_modules'));
    }
    return paths;
}
//# sourceMappingURL=getModulesPaths.js.map