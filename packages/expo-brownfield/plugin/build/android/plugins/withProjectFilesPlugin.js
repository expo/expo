"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_plugins_1 = require("expo/config-plugins");
const common_1 = require("../../common");
const utils_1 = require("../utils");
const withProjectFilesPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        // Define paths for the brownfield target
        const brownfieldPath = node_path_1.default.join(pluginConfig.projectRoot, `android/${pluginConfig.libraryName}`);
        const brownfieldMainPath = node_path_1.default.join(brownfieldPath, 'src/main/');
        const brownfieldSourcesPath = node_path_1.default.join(brownfieldMainPath, pluginConfig.packagePath);
        // Create directory for the brownfield library sources
        // (and all intermediate directories)
        (0, common_1.mkdir)(brownfieldSourcesPath, true);
        // Add files from templates to the brownfield library:
        // - AndroidManifest.xml
        // - BrownfieldActivity.kt
        // - ReactNativeHostManager.kt
        // - ReactNativeViewFactory.kt
        // - ReactNativeFragment.kt
        // - build.gradle.kts
        // - proguard-rules.pro
        // - consumer-rules.pro
        (0, utils_1.createFileFromTemplate)('AndroidManifest.xml', brownfieldMainPath);
        (0, utils_1.createFileFromTemplate)('BrownfieldActivity.kt', brownfieldSourcesPath, {
            packageId: pluginConfig.package,
        });
        (0, utils_1.createFileFromTemplate)('ReactNativeHostManager.kt', brownfieldSourcesPath, {
            packageId: pluginConfig.package,
        });
        (0, utils_1.createFileFromTemplate)('ReactNativeViewFactory.kt', brownfieldSourcesPath, {
            packageId: pluginConfig.package,
        });
        (0, utils_1.createFileFromTemplate)('ReactNativeFragment.kt', brownfieldSourcesPath, {
            packageId: pluginConfig.package,
        });
        (0, utils_1.createFileFromTemplate)('build.gradle.kts', brownfieldPath, {
            packageId: pluginConfig.package,
            groupId: pluginConfig.group,
            version: pluginConfig.version,
        });
        (0, utils_1.createFileFromTemplate)('proguard-rules.pro', brownfieldPath);
        (0, utils_1.createFileFromTemplate)('consumer-rules.pro', brownfieldPath);
        return config;
    });
};
exports.default = withProjectFilesPlugin;
