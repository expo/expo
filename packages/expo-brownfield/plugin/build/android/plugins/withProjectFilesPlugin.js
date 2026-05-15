"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const node_path_1 = __importDefault(require("node:path"));
const common_1 = require("../../common");
const utils_1 = require("../utils");
const withProjectFilesPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        // Define paths for the brownfield target
        const brownfieldPath = node_path_1.default.join(pluginConfig.projectRoot, `android/${pluginConfig.libraryName}`);
        const brownfieldMainPath = node_path_1.default.join(brownfieldPath, 'src/main/');
        const brownfieldSourcesPath = node_path_1.default.join(brownfieldMainPath, pluginConfig.packagePath);
        // The fused sibling sits next to the brownfield library so AGP's
        // `com.android.fused-library` plugin can `include(project(":<expoModule>"))` from
        // the same Gradle build. It carries no sources — only an `include()` list. Built
        // only when the user opts in via `expo-brownfield build:android --fused`.
        const fusedPath = node_path_1.default.join(pluginConfig.projectRoot, `android/${pluginConfig.libraryName}-fused`);
        // Create directory for the brownfield library sources
        // (and all intermediate directories)
        (0, common_1.mkdir)(brownfieldSourcesPath, true);
        (0, common_1.mkdir)(fusedPath, true);
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
        // Emit the fused sibling's build.gradle.kts. The template lives at
        // packages/expo-brownfield/plugin/templates/android/fused/build.gradle.kts.
        // It is only assembled when the user runs `expo-brownfield build:android --fused`.
        (0, utils_1.createFileFromTemplateAs)(node_path_1.default.join('fused', 'build.gradle.kts'), fusedPath, 'build.gradle.kts', {
            packageId: pluginConfig.package,
            groupId: pluginConfig.group,
            version: pluginConfig.version,
            libraryName: pluginConfig.libraryName,
        });
        // Adjust ReactNativeHostManager and BrownfieldActivity to initialize dev menu
        if ((0, common_1.checkPlugin)(config, 'expo-dev-menu')) {
            (0, common_1.applyPatchToFile)('ReactNativeHostManager.patch', node_path_1.default.join(brownfieldSourcesPath, 'ReactNativeHostManager.kt'));
            (0, common_1.applyPatchToFile)('BrownfieldActivity.patch', node_path_1.default.join(brownfieldSourcesPath, 'BrownfieldActivity.kt'));
            (0, common_1.applyPatchToFile)('build.gradle.patch', node_path_1.default.join(brownfieldPath, 'build.gradle.kts'));
        }
        return config;
    });
};
exports.default = withProjectFilesPlugin;
