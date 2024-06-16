"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostcssConfigHash = exports.resolvePostcssConfig = exports.pluginFactory = exports.transformPostCssModule = void 0;
/**
 * Copyright © 2023 650 Industries.
 * Copyright JS Foundation and other contributors
 *
 * https://github.com/webpack-contrib/postcss-loader/
 */
const json_file_1 = __importDefault(require("@expo/json-file"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const require_1 = require("./utils/require");
const CONFIG_FILE_NAME = 'postcss.config';
const debug = require('debug')('expo:metro:transformer:postcss');
async function transformPostCssModule(projectRoot, { src, filename }) {
    const inputConfig = resolvePostcssConfig(projectRoot);
    if (!inputConfig) {
        return { src, hasPostcss: false };
    }
    return {
        src: await processWithPostcssInputConfigAsync(projectRoot, {
            inputConfig,
            src,
            filename,
        }),
        hasPostcss: true,
    };
}
exports.transformPostCssModule = transformPostCssModule;
async function processWithPostcssInputConfigAsync(projectRoot, { src, filename, inputConfig }) {
    const { plugins, processOptions } = await parsePostcssConfigAsync(projectRoot, {
        config: inputConfig,
        resourcePath: filename,
    });
    debug('options:', processOptions);
    debug('plugins:', plugins);
    // TODO: Surely this can be cached...
    const postcss = require('postcss');
    const processor = postcss.default(plugins);
    const { content } = await processor.process(src, processOptions);
    return content;
}
async function parsePostcssConfigAsync(projectRoot, { resourcePath: file, config: { plugins: inputPlugins, map, parser, stringifier, syntax, ...config } = {}, }) {
    const factory = pluginFactory();
    factory(inputPlugins);
    // delete config.plugins;
    const plugins = [...factory()].map((item) => {
        const [plugin, options] = item;
        if (typeof plugin === 'string') {
            return loadPlugin(projectRoot, plugin, options, file);
        }
        return plugin;
    });
    if (config.from) {
        config.from = path_1.default.resolve(projectRoot, config.from);
    }
    if (config.to) {
        config.to = path_1.default.resolve(projectRoot, config.to);
    }
    const processOptions = {
        from: file,
        to: file,
        map: false,
    };
    if (typeof parser === 'string') {
        try {
            processOptions.parser = await (0, require_1.tryRequireThenImport)(resolve_from_1.default.silent(projectRoot, parser) ?? parser);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Loading PostCSS "${parser}" parser failed: ${error.message}\n\n(@${file})`);
            }
            throw error;
        }
    }
    if (typeof stringifier === 'string') {
        try {
            processOptions.stringifier = await (0, require_1.tryRequireThenImport)(resolve_from_1.default.silent(projectRoot, stringifier) ?? stringifier);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Loading PostCSS "${stringifier}" stringifier failed: ${error.message}\n\n(@${file})`);
            }
            throw error;
        }
    }
    if (typeof syntax === 'string') {
        try {
            processOptions.syntax = await (0, require_1.tryRequireThenImport)(resolve_from_1.default.silent(projectRoot, syntax) ?? syntax);
        }
        catch (error) {
            throw new Error(`Loading PostCSS "${syntax}" syntax failed: ${error.message}\n\n(@${file})`);
        }
    }
    if (map === true) {
        // https://github.com/postcss/postcss/blob/master/docs/source-maps.md
        processOptions.map = { inline: true };
    }
    return { plugins, processOptions };
}
function loadPlugin(projectRoot, plugin, options, file) {
    try {
        debug('load plugin:', plugin);
        // e.g. `tailwindcss`
        let loadedPlugin = require((0, resolve_from_1.default)(projectRoot, plugin));
        if (loadedPlugin.default) {
            loadedPlugin = loadedPlugin.default;
        }
        if (!options || !Object.keys(options).length) {
            return loadedPlugin;
        }
        return loadedPlugin(options);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Loading PostCSS "${plugin}" plugin failed: ${error.message}\n\n(@${file})`);
        }
        throw error;
    }
}
function pluginFactory() {
    const listOfPlugins = new Map();
    return (plugins) => {
        if (typeof plugins === 'undefined') {
            return listOfPlugins;
        }
        if (Array.isArray(plugins)) {
            for (const plugin of plugins) {
                if (Array.isArray(plugin)) {
                    const [name, options] = plugin;
                    if (typeof name !== 'string') {
                        throw new Error(`PostCSS plugin must be a string, but "${name}" was found. Please check your configuration.`);
                    }
                    listOfPlugins.set(name, options);
                }
                else if (plugin && typeof plugin === 'function') {
                    listOfPlugins.set(plugin, undefined);
                }
                else if (plugin &&
                    Object.keys(plugin).length === 1 &&
                    (typeof plugin[Object.keys(plugin)[0]] === 'object' ||
                        typeof plugin[Object.keys(plugin)[0]] === 'boolean') &&
                    plugin[Object.keys(plugin)[0]] !== null) {
                    const [name] = Object.keys(plugin);
                    const options = plugin[name];
                    if (options === false) {
                        listOfPlugins.delete(name);
                    }
                    else {
                        listOfPlugins.set(name, options);
                    }
                }
                else if (plugin) {
                    listOfPlugins.set(plugin, undefined);
                }
            }
        }
        else {
            const objectPlugins = Object.entries(plugins);
            for (const [name, options] of objectPlugins) {
                if (options === false) {
                    listOfPlugins.delete(name);
                }
                else {
                    listOfPlugins.set(name, options);
                }
            }
        }
        return listOfPlugins;
    };
}
exports.pluginFactory = pluginFactory;
function resolvePostcssConfig(projectRoot) {
    // TODO: Maybe support platform-specific postcss config files in the future.
    const jsConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.js');
    if (fs_1.default.existsSync(jsConfigPath)) {
        debug('load file:', jsConfigPath);
        return (0, require_1.requireUncachedFile)(jsConfigPath);
    }
    const jsonConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.json');
    if (fs_1.default.existsSync(jsonConfigPath)) {
        debug('load file:', jsonConfigPath);
        return json_file_1.default.read(jsonConfigPath, { json5: true });
    }
    return null;
}
exports.resolvePostcssConfig = resolvePostcssConfig;
function getPostcssConfigHash(projectRoot) {
    // TODO: Maybe recurse plugins and add versions to the hash in the future.
    const { stableHash } = require('metro-cache');
    const jsConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.js');
    if (fs_1.default.existsSync(jsConfigPath)) {
        return stableHash(fs_1.default.readFileSync(jsConfigPath, 'utf8')).toString('hex');
    }
    const jsonConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.json');
    if (fs_1.default.existsSync(jsonConfigPath)) {
        return stableHash(fs_1.default.readFileSync(jsonConfigPath, 'utf8')).toString('hex');
    }
    return null;
}
exports.getPostcssConfigHash = getPostcssConfigHash;
//# sourceMappingURL=postcss.js.map