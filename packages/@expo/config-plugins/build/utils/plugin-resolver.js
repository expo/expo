"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfigPluginExport = exports.resolveConfigPluginFunctionWithInfo = exports.resolveConfigPluginFunction = exports.assertInternalProjectRoot = exports.normalizeStaticPlugin = exports.moduleNameIsDirectFileReference = exports.resolvePluginForModule = exports.pluginFileName = void 0;
const assert_1 = __importDefault(require("assert"));
const find_up_1 = __importDefault(require("find-up"));
const path = __importStar(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const errors_1 = require("./errors");
const modules_1 = require("./modules");
// Default plugin entry file name.
exports.pluginFileName = 'app.plugin.js';
function findUpPackageJson(root) {
    const packageJson = find_up_1.default.sync('package.json', { cwd: root });
    (0, assert_1.default)(packageJson, `No package.json found for module "${root}"`);
    return packageJson;
}
function resolvePluginForModule(projectRoot, modulePath) {
    const resolved = resolve_from_1.default.silent(projectRoot, modulePath);
    if (!resolved) {
        throw new errors_1.PluginError(`Failed to resolve plugin for module "${modulePath}" relative to "${projectRoot}"`, 'PLUGIN_NOT_FOUND');
    }
    // If the modulePath is something like `@bacon/package/index.js` or `expo-foo/build/app`
    // then skip resolving the module `app.plugin.js`
    if (moduleNameIsDirectFileReference(modulePath)) {
        return { isPluginFile: false, filePath: resolved };
    }
    return findUpPlugin(resolved);
}
exports.resolvePluginForModule = resolvePluginForModule;
// TODO: Test windows
function pathIsFilePath(name) {
    // Matches lines starting with: . / ~/
    return !!name.match(/^(\.|~\/|\/)/g);
}
function moduleNameIsDirectFileReference(name) {
    if (pathIsFilePath(name)) {
        return true;
    }
    const slashCount = name.split(path.sep)?.length;
    // Orgs (like @expo/config ) should have more than one slash to be a direct file.
    if (name.startsWith('@')) {
        return slashCount > 2;
    }
    // Regular packages should be considered direct reference if they have more than one slash.
    return slashCount > 1;
}
exports.moduleNameIsDirectFileReference = moduleNameIsDirectFileReference;
function resolveExpoPluginFile(root) {
    // Find the expo plugin root file
    const pluginModuleFile = resolve_from_1.default.silent(root, 
    // use ./ so it isn't resolved as a node module
    `./${exports.pluginFileName}`);
    // If the default expo plugin file exists use it.
    if (pluginModuleFile && (0, modules_1.fileExists)(pluginModuleFile)) {
        return pluginModuleFile;
    }
    return null;
}
function findUpPlugin(root) {
    // Get the closest package.json to the node module
    const packageJson = findUpPackageJson(root);
    // resolve the root folder for the node module
    const moduleRoot = path.dirname(packageJson);
    // use whatever the initial resolved file was ex: `node_modules/my-package/index.js` or `./something.js`
    const pluginFile = resolveExpoPluginFile(moduleRoot);
    return { filePath: pluginFile ?? root, isPluginFile: !!pluginFile };
}
function normalizeStaticPlugin(plugin) {
    if (Array.isArray(plugin)) {
        (0, assert_1.default)(plugin.length > 0 && plugin.length < 3, `Wrong number of arguments provided for static config plugin, expected either 1 or 2, got ${plugin.length}`);
        return plugin;
    }
    return [plugin, undefined];
}
exports.normalizeStaticPlugin = normalizeStaticPlugin;
function assertInternalProjectRoot(projectRoot) {
    (0, assert_1.default)(projectRoot, `Unexpected: Config \`_internal.projectRoot\` isn't defined by expo-cli, this is a bug.`);
}
exports.assertInternalProjectRoot = assertInternalProjectRoot;
// Resolve the module function and assert type
function resolveConfigPluginFunction(projectRoot, pluginReference) {
    const { plugin } = resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference);
    return plugin;
}
exports.resolveConfigPluginFunction = resolveConfigPluginFunction;
// Resolve the module function and assert type
function resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference) {
    const { filePath: pluginFile, isPluginFile } = resolvePluginForModule(projectRoot, pluginReference);
    let result;
    try {
        result = requirePluginFile(pluginFile);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
            // If the plugin reference is a node module, and that node module has a syntax error, then it probably doesn't have an official config plugin.
            if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
                const pluginError = new errors_1.PluginError(`Package "${pluginReference}" does not contain a valid config plugin.\n${learnMoreLink}\n\n${error.message}`, 'INVALID_PLUGIN_IMPORT');
                pluginError.stack = error.stack;
                throw pluginError;
            }
        }
        throw error;
    }
    const plugin = resolveConfigPluginExport({
        plugin: result,
        pluginFile,
        pluginReference,
        isPluginFile,
    });
    return { plugin, pluginFile, pluginReference, isPluginFile };
}
exports.resolveConfigPluginFunctionWithInfo = resolveConfigPluginFunctionWithInfo;
/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param props.plugin plugin results
 * @param props.pluginFile plugin file path
 * @param props.pluginReference the string used to reference the plugin
 * @param props.isPluginFile is file path from the app.plugin.js module root
 */
function resolveConfigPluginExport({ plugin, pluginFile, pluginReference, isPluginFile, }) {
    if (plugin.default != null) {
        plugin = plugin.default;
    }
    if (typeof plugin !== 'function') {
        const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
        // If the plugin reference is a node module, and that node module does not export a function then it probably doesn't have a config plugin.
        if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
            throw new errors_1.PluginError(`Package "${pluginReference}" does not contain a valid config plugin. Module must export a function from file: ${pluginFile}\n${learnMoreLink}`, 'INVALID_PLUGIN_TYPE');
        }
        throw new errors_1.PluginError(`Plugin "${pluginReference}" must export a function from file: ${pluginFile}. ${learnMoreLink}`, 'INVALID_PLUGIN_TYPE');
    }
    return plugin;
}
exports.resolveConfigPluginExport = resolveConfigPluginExport;
function requirePluginFile(filePath) {
    try {
        return require(filePath);
    }
    catch (error) {
        // TODO: Improve error messages
        throw error;
    }
}
