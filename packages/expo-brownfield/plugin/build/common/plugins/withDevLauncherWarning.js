"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const EXPO_DEV_CLIENT = 'expo-dev-client';
// We only want to notify the user once
let DID_NOTIFY = false;
const withDevLauncherWarning = (config) => {
    if (!DID_NOTIFY && (maybeGetFromPlugins(config) || maybeGetFromPackageJson(config))) {
        DID_NOTIFY = true;
        console.warn("⚠ It seems that you're using `expo-dev-client` with `expo-brownfield`");
        console.warn("`expo-dev-client` isn't currently supported in the isolated brownfield setup");
        console.warn('Please use `expo-dev-menu` instead');
    }
};
const maybeGetFromPlugins = (config) => {
    if (!config.plugins) {
        return false;
    }
    config.plugins.forEach((plugin) => {
        if ((Array.isArray(plugin) && plugin[0] === EXPO_DEV_CLIENT) || plugin === EXPO_DEV_CLIENT) {
            return true;
        }
    });
    return false;
};
const maybeGetFromPackageJson = (config) => {
    const packageJsonPath = [
        config._internal?.packageJsonPath,
        config._internal?.projectRoot
            ? path_1.default.join(config._internal?.projectRoot, 'package.json')
            : undefined,
        path_1.default.join(process.cwd(), 'package.json'),
    ].find(ensureIsValidPath);
    if (!packageJsonPath) {
        return false;
    }
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.dependencies?.[EXPO_DEV_CLIENT]) {
        return true;
    }
    return false;
};
const ensureIsValidPath = (path) => {
    return path && fs_1.default.existsSync(path);
};
exports.default = withDevLauncherWarning;
