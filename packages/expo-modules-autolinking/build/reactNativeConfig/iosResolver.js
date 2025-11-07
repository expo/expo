"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependencyConfigImplIosAsync = resolveDependencyConfigImplIosAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
/** Find first *.podspec file in target directory */
const findPodspecFile = async (targetPath) => {
    const podspecFiles = await (0, utils_1.listFilesSorted)(targetPath, (basename) => {
        return basename.endsWith('.podspec');
    });
    // NOTE(@kitten): Compare case-insensitively against basename of derived name
    const mainBasename = path_1.default.basename(targetPath).toLowerCase();
    const mainPodspecFile = podspecFiles.find((podspecFile) => path_1.default.basename(podspecFile, '.podspec').toLowerCase() === mainBasename);
    return mainPodspecFile ?? (podspecFiles.length > 0 ? podspecFiles[0] : null);
};
async function resolveDependencyConfigImplIosAsync(resolution, reactNativeConfig, expoModuleConfig) {
    if (reactNativeConfig === null) {
        // Skip autolinking for this package.
        return null;
    }
    const mainPackagePodspec = path_1.default.join(resolution.path, path_1.default.basename(resolution.path) + '.podspec');
    const podspecPath = fs_1.default.existsSync(mainPackagePodspec)
        ? mainPackagePodspec
        : await findPodspecFile(resolution.path);
    if (!podspecPath) {
        return null;
    }
    if (reactNativeConfig === undefined && expoModuleConfig?.supportsPlatform('apple')) {
        // Check if Expo podspec files contain the React Native podspec file
        const overlappingPodspecPath = expoModuleConfig.applePodspecPaths().find((targetFile) => {
            const expoPodspecPath = path_1.default.join(resolution.path, targetFile);
            return expoPodspecPath === podspecPath;
        });
        // NOTE(@kitten): If we don't have a react-native.config.{js,ts} file and the
        // package is also an Expo module, we only link it as a React Native module
        // if both don't point at the same podspec file
        if (overlappingPodspecPath != null) {
            return null;
        }
    }
    return {
        podspecPath,
        version: resolution.version,
        configurations: reactNativeConfig?.configurations || [],
        scriptPhases: reactNativeConfig?.scriptPhases || [],
    };
}
//# sourceMappingURL=iosResolver.js.map