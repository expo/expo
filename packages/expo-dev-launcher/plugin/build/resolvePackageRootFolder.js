"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePackageRootFolder = void 0;
const find_up_1 = __importDefault(require("find-up"));
const path = __importStar(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
function resolvePackageRootFolder(fromDirectory, moduleId) {
    const resolved = resolve_from_1.default.silent(fromDirectory, moduleId);
    if (!resolved)
        return null;
    // Get the closest package.json to the node module
    const packageJson = find_up_1.default.sync('package.json', { cwd: resolved });
    if (!packageJson)
        return null;
    // resolve the root folder for the node module
    return path.dirname(packageJson);
}
exports.resolvePackageRootFolder = resolvePackageRootFolder;
