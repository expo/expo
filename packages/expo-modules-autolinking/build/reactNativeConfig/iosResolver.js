"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependencyConfigImplIosAsync = resolveDependencyConfigImplIosAsync;
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
async function resolveDependencyConfigImplIosAsync(resolution, reactNativeConfig) {
    if (reactNativeConfig === null) {
        // Skip autolinking for this package.
        return null;
    }
    const podspecs = await (0, glob_1.glob)('*.podspec', { cwd: resolution.path });
    if (!podspecs?.length) {
        return null;
    }
    const mainPackagePodspec = path_1.default.basename(resolution.path) + '.podspec';
    const podspecFile = podspecs.includes(mainPackagePodspec)
        ? mainPackagePodspec
        : podspecs.sort((a, b) => a.localeCompare(b))[0];
    const podspecPath = path_1.default.join(resolution.path, podspecFile);
    return {
        podspecPath,
        version: resolution.version,
        configurations: reactNativeConfig?.configurations || [],
        scriptPhases: reactNativeConfig?.scriptPhases || [],
    };
}
//# sourceMappingURL=iosResolver.js.map