"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPlugin = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Tries to find specified plugin in the expo config or package.json dependencies
 */
const checkPlugin = (config, pluginName) => {
    return checkExpoConfig(config, pluginName) || checkPackageJson(config, pluginName);
};
exports.checkPlugin = checkPlugin;
/**
 * Check if the plugin is specified in the expo config
 */
const checkExpoConfig = (config, pluginName) => {
    if (!config.plugins) {
        return false;
    }
    return config.plugins.some((plugin) => Array.isArray(plugin) ? plugin[0] === pluginName : plugin === pluginName);
};
/**
 * Check if the plugin is installed in the package.json
 */
const checkPackageJson = (config, pluginName) => {
    const packageJsonPath = [
        config._internal?.packageJsonPath,
        config._internal?.projectRoot
            ? path_1.default.join(config._internal?.projectRoot, 'package.json')
            : undefined,
        path_1.default.join(process.cwd(), 'package.json'),
    ].find((filepath) => filepath && fs_1.default.existsSync(filepath));
    if (!packageJsonPath) {
        return false;
    }
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.dependencies?.[pluginName] ||
        packageJson.devDependencies?.[pluginName] ||
        packageJson.peerDependencies?.[pluginName]) {
        return true;
    }
    return false;
};
