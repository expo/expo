"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileWithExtensions = exports.resolveEntryPoint = exports.getPossibleProjectRoot = exports.ensureSlash = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const extensions_1 = require("./extensions");
const Config_1 = require("../Config");
const Errors_1 = require("../Errors");
// https://github.com/facebook/create-react-app/blob/9750738cce89a967cc71f28390daf5d4311b193c/packages/react-scripts/config/paths.js#L22
function ensureSlash(inputPath, needsSlash) {
    const hasSlash = inputPath.endsWith('/');
    if (hasSlash && !needsSlash) {
        return inputPath.substr(0, inputPath.length - 1);
    }
    else if (!hasSlash && needsSlash) {
        return `${inputPath}/`;
    }
    else {
        return inputPath;
    }
}
exports.ensureSlash = ensureSlash;
function getPossibleProjectRoot() {
    return fs_1.default.realpathSync(process.cwd());
}
exports.getPossibleProjectRoot = getPossibleProjectRoot;
const nativePlatforms = ['ios', 'android'];
/** @returns the absolute entry file for an Expo project. */
function resolveEntryPoint(projectRoot, { platform, pkg = (0, Config_1.getPackageJson)(projectRoot), } = {}) {
    const platforms = !platform
        ? []
        : nativePlatforms.includes(platform)
            ? [platform, 'native']
            : [platform];
    const extensions = (0, extensions_1.getBareExtensions)(platforms);
    // If the config doesn't define a custom entry then we want to look at the `package.json`s `main` field, and try again.
    const { main } = pkg;
    if (main && typeof main === 'string') {
        // Testing the main field against all of the provided extensions - for legacy reasons we can't use node module resolution as the package.json allows you to pass in a file without a relative path and expect it as a relative path.
        let entry = getFileWithExtensions(projectRoot, main, extensions);
        if (!entry) {
            // Allow for paths like: `{ "main": "expo/AppEntry" }`
            entry = resolveFromSilentWithExtensions(projectRoot, main, extensions);
            if (!entry)
                throw new Errors_1.ConfigError(`Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to an unresolvable or non-existent path.`, 'ENTRY_NOT_FOUND');
        }
        return entry;
    }
    // Check for a root index.* file in the project root.
    const entry = resolveFromSilentWithExtensions(projectRoot, './index', extensions);
    if (entry) {
        return entry;
    }
    try {
        // If none of the default files exist then we will attempt to use the main Expo entry point.
        // This requires `expo` to be installed in the project to work as it will use `node_module/expo/AppEntry.js`
        // Doing this enables us to create a bare minimum Expo project.
        // TODO(Bacon): We may want to do a check against `./App` and `expo` in the `package.json` `dependencies` as we can more accurately ensure that the project is expo-min without needing the modules installed.
        return (0, resolve_from_1.default)(projectRoot, 'expo/AppEntry');
    }
    catch {
        throw new Errors_1.ConfigError(`The project entry file could not be resolved. Define it in the \`main\` field of the \`package.json\`, create an \`index.js\`, or install the \`expo\` package.`, 'ENTRY_NOT_FOUND');
    }
}
exports.resolveEntryPoint = resolveEntryPoint;
// Resolve from but with the ability to resolve like a bundler
function resolveFromSilentWithExtensions(fromDirectory, moduleId, extensions) {
    for (const extension of extensions) {
        const modulePath = resolve_from_1.default.silent(fromDirectory, `${moduleId}.${extension}`);
        if (modulePath?.endsWith(extension)) {
            return modulePath;
        }
    }
    return resolve_from_1.default.silent(fromDirectory, moduleId) || null;
}
// Statically attempt to resolve a module but with the ability to resolve like a bundler.
// This won't use node module resolution.
function getFileWithExtensions(fromDirectory, moduleId, extensions) {
    const modulePath = path_1.default.join(fromDirectory, moduleId);
    if (fs_1.default.existsSync(modulePath)) {
        return modulePath;
    }
    for (const extension of extensions) {
        const modulePath = path_1.default.join(fromDirectory, `${moduleId}.${extension}`);
        if (fs_1.default.existsSync(modulePath)) {
            return modulePath;
        }
    }
    return null;
}
exports.getFileWithExtensions = getFileWithExtensions;
