"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependencyConfigImplIosAsync = resolveDependencyConfigImplIosAsync;
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
async function resolveDependencyConfigImplIosAsync(packageRoot, reactNativeConfig) {
    if (reactNativeConfig === null) {
        // Skip autolinking for this package.
        return null;
    }
    const podspecs = await (0, glob_1.glob)('*.podspec', { cwd: packageRoot });
    if (!podspecs?.length) {
        return null;
    }
    const mainPackagePodspec = path_1.default.basename(packageRoot) + '.podspec';
    const podspecFile = podspecs.includes(mainPackagePodspec)
        ? mainPackagePodspec
        : podspecs.sort((a, b) => a.localeCompare(b))[0];
    const podspecPath = path_1.default.join(packageRoot, podspecFile);
    const packageJson = JSON.parse(await promises_1.default.readFile(path_1.default.join(packageRoot, 'package.json'), 'utf8'));
    return {
        podspecPath,
        version: packageJson.version,
        configurations: reactNativeConfig?.configurations || [],
        scriptPhases: reactNativeConfig?.scriptPhases || [],
    };
}
//# sourceMappingURL=iosResolver.js.map