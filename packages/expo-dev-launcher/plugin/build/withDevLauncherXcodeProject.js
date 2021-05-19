"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDevLauncherXcodeProject = exports.modifyReactNativeBuildPhase = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const DEV_LAUNCHER_SCRIPT_PATH = 'expo-dev-launcher/scripts/ios.sh';
function getBundleReactNativePhase(project) {
    const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase;
    const bundleReactNative = Object.values(shellScriptBuildPhase).find(buildPhase => buildPhase.name === '"Bundle React Native code and images"');
    if (!bundleReactNative) {
        throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
    }
    return bundleReactNative;
}
function formatConfigurationScriptPath(projectRoot) {
    const buildScriptPath = resolve_from_1.default.silent(projectRoot, DEV_LAUNCHER_SCRIPT_PATH);
    if (!buildScriptPath) {
        throw new Error("Could not find the build script for iOS. This can happen in the case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
    }
    return path_1.default.relative(path_1.default.join(projectRoot, 'ios'), buildScriptPath);
}
function isShellScriptBuildPhaseConfigured(projectRoot, project) {
    const bundleReactNative = getBundleReactNativePhase(project);
    const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
    return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}
function modifyReactNativeBuildPhase(projectRoot, project) {
    const bundleReactNative = getBundleReactNativePhase(project);
    const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
    if (!isShellScriptBuildPhaseConfigured(projectRoot, project)) {
        // check if there's already another path to create-manifest-ios.sh
        // this might be the case for monorepos
        if (bundleReactNative.shellScript.includes(DEV_LAUNCHER_SCRIPT_PATH)) {
            bundleReactNative.shellScript = bundleReactNative.shellScript.replace(new RegExp(`(\\\\n)(\\.\\.)+/node_modules/${DEV_LAUNCHER_SCRIPT_PATH}`), '');
        }
        bundleReactNative.shellScript = `${bundleReactNative.shellScript.replace(/"$/, '')}${buildPhaseShellScriptPath}\\n"`;
    }
    return project;
}
exports.modifyReactNativeBuildPhase = modifyReactNativeBuildPhase;
exports.withDevLauncherXcodeProject = config => {
    return config_plugins_1.withXcodeProject(config, async (config) => {
        const projectRoot = config.modRequest.projectRoot;
        const xcodeProject = config.modResults;
        modifyReactNativeBuildPhase(projectRoot, xcodeProject);
        return config;
    });
};
