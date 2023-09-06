"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoSDKVersion = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const Errors_1 = require("./Errors");
/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
function getExpoSDKVersion(projectRoot, exp = {}) {
    return exp?.sdkVersion ?? getExpoSDKVersionFromPackage(projectRoot);
}
exports.getExpoSDKVersion = getExpoSDKVersion;
/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
function getExpoSDKVersionFromPackage(projectRoot) {
    const packageJsonPath = resolve_from_1.default.silent(projectRoot, 'expo/package.json');
    if (!packageJsonPath) {
        throw new Errors_1.ConfigError(`Cannot determine which native SDK version your project uses because the module \`expo\` is not installed. Please install it with \`yarn add expo\` and try again.`, 'MODULE_NOT_FOUND');
    }
    const expoPackageJson = json_file_1.default.read(packageJsonPath, { json5: true });
    const { version: packageVersion } = expoPackageJson;
    if (!(typeof packageVersion === 'string')) {
        // This is technically impossible.
        throw new Errors_1.ConfigError(`Cannot determine which native SDK version your project uses because the module \`expo\` has an invalid package.json (missing \`version\` field). Try reinstalling node modules and trying again.`, 'MODULE_NOT_FOUND');
    }
    const majorVersion = packageVersion.split('.').shift();
    return `${majorVersion}.0.0`;
}
