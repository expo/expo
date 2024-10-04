"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleAsync = void 0;
const path_1 = __importDefault(require("path"));
async function resolveModuleAsync(packageName, revision) {
    const devtoolsConfig = revision.config?.toJSON().devtools;
    if (devtoolsConfig == null) {
        return null;
    }
    return {
        packageName,
        packageRoot: revision.path,
        webpageRoot: path_1.default.join(revision.path, devtoolsConfig.webpageRoot),
    };
}
exports.resolveModuleAsync = resolveModuleAsync;
//# sourceMappingURL=devtools.js.map