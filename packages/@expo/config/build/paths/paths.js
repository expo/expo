"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileWithExtensions = exports.resolveFromSilentWithExtensions = exports.getEntryPointWithExtensions = exports.getEntryPoint = exports.resolveEntryPoint = exports.getPossibleProjectRoot = exports.ensureSlash = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const extensions_1 = require("./extensions");
const Config_1 = require("../Config");
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
function resolveEntryPoint(projectRoot, { platform, projectConfig }) {
    const platforms = nativePlatforms.includes(platform) ? [platform, 'native'] : [platform];
    return getEntryPoint(projectRoot, ['./index'], platforms, projectConfig);
}
exports.resolveEntryPoint = resolveEntryPoint;
function getEntryPoint(projectRoot, entryFiles, platforms, projectConfig) {
    const extensions = (0, extensions_1.getBareExtensions)(platforms);
    return getEntryPointWithExtensions(projectRoot, entryFiles, extensions, projectConfig);
}
exports.getEntryPoint = getEntryPoint;
// Used to resolve the main entry file for a project.
function getEntryPointWithExtensions(projectRoot, entryFiles, extensions, projectConfig) {
    if (!projectConfig) {
        // drop all logging abilities
        const original = process.stdout.write;
        process.stdout.write = () => true;
        try {
            projectConfig = (0, Config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true });
        }
        finally {
            process.stdout.write = original;
        }
    }
    const { pkg } = projectConfig;
    if (pkg) {
        // If the config doesn't define a custom entry then we want to look at the `package.json`s `main` field, and try again.
        const { main } = pkg;
        if (main && typeof main === 'string') {
            // Testing the main field against all of the provided extensions - for legacy reasons we can't use node module resolution as the package.json allows you to pass in a file without a relative path and expect it as a relative path.
            let entry = getFileWithExtensions(projectRoot, main, extensions);
            if (!entry) {
                // Allow for paths like: `{ "main": "expo/AppEntry" }`
                entry = resolveFromSilentWithExtensions(projectRoot, main, extensions);
                if (!entry)
                    throw new Error(`Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to a non-existent path.`);
            }
            return entry;
        }
    }
    // Now we will start looking for a default entry point using the provided `entryFiles` argument.
    // This will add support for create-react-app (src/index.js) and react-native-cli (index.js) which don't define a main.
    for (const fileName of entryFiles) {
        const entry = resolveFromSilentWithExtensions(projectRoot, fileName, extensions);
        if (entry)
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
        throw new Error(`The project entry file could not be resolved. Please define it in the \`main\` field of the \`package.json\`, create an \`index.js\`, or install the \`expo\` package.`);
    }
}
exports.getEntryPointWithExtensions = getEntryPointWithExtensions;
// Resolve from but with the ability to resolve like a bundler
function resolveFromSilentWithExtensions(fromDirectory, moduleId, extensions) {
    for (const extension of extensions) {
        const modulePath = resolve_from_1.default.silent(fromDirectory, `${moduleId}.${extension}`);
        if (modulePath && modulePath.endsWith(extension)) {
            return modulePath;
        }
    }
    return resolve_from_1.default.silent(fromDirectory, moduleId) || null;
}
exports.resolveFromSilentWithExtensions = resolveFromSilentWithExtensions;
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
