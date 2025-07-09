"use strict";
// This package needs to be imported from within the project to
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMetroConfig = importMetroConfig;
const resolve_from_1 = __importDefault(require("resolve-from"));
// ensure that Metro can bundle the project's assets (see: `watchFolders`).
function importMetroConfig(projectRoot) {
    const modulePath = resolve_from_1.default.silent(projectRoot, 'metro-config');
    if (!modulePath) {
        return require('metro-config');
    }
    return require(modulePath);
}
//# sourceMappingURL=metro-config.js.map