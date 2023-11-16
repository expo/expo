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
exports.evalModsAsync = exports.compileModsAsync = exports.withIntrospectionBaseMods = exports.withDefaultBaseMods = void 0;
const debug_1 = __importDefault(require("debug"));
const path_1 = __importDefault(require("path"));
const createBaseMod_1 = require("./createBaseMod");
const withAndroidBaseMods_1 = require("./withAndroidBaseMods");
const withIosBaseMods_1 = require("./withIosBaseMods");
const Xcodeproj_1 = require("../ios/utils/Xcodeproj");
const errors_1 = require("../utils/errors");
const Warnings = __importStar(require("../utils/warnings"));
const debug = (0, debug_1.default)('expo:config-plugins:mod-compiler');
function withDefaultBaseMods(config, props = {}) {
    config = (0, withIosBaseMods_1.withIosBaseMods)(config, props);
    config = (0, withAndroidBaseMods_1.withAndroidBaseMods)(config, props);
    return config;
}
exports.withDefaultBaseMods = withDefaultBaseMods;
/**
 * Get a prebuild config that safely evaluates mods without persisting any changes to the file system.
 * Currently this only supports infoPlist, entitlements, androidManifest, strings, gradleProperties, and expoPlist mods.
 * This plugin should be evaluated directly:
 */
function withIntrospectionBaseMods(config, props = {}) {
    config = (0, withIosBaseMods_1.withIosBaseMods)(config, {
        saveToInternal: true,
        // This writing optimization can be skipped since we never write in introspection mode.
        // Including empty mods will ensure that all mods get introspected.
        skipEmptyMod: false,
        ...props,
    });
    config = (0, withAndroidBaseMods_1.withAndroidBaseMods)(config, {
        saveToInternal: true,
        skipEmptyMod: false,
        ...props,
    });
    if (config.mods) {
        // Remove all mods that don't have an introspection base mod, for instance `dangerous` mods.
        for (const platform of Object.keys(config.mods)) {
            // const platformPreserve = preserve[platform];
            for (const key of Object.keys(config.mods[platform] || {})) {
                // @ts-ignore
                if (!config.mods[platform]?.[key]?.isIntrospective) {
                    debug(`removing non-idempotent mod: ${platform}.${key}`);
                    // @ts-ignore
                    delete config.mods[platform]?.[key];
                }
            }
        }
    }
    return config;
}
exports.withIntrospectionBaseMods = withIntrospectionBaseMods;
/**
 *
 * @param projectRoot
 * @param config
 */
async function compileModsAsync(config, props) {
    if (props.introspect === true) {
        config = withIntrospectionBaseMods(config);
    }
    else {
        config = withDefaultBaseMods(config);
    }
    return await evalModsAsync(config, props);
}
exports.compileModsAsync = compileModsAsync;
function sortMods(commands, order) {
    const allKeys = commands.map(([key]) => key);
    const completeOrder = [...new Set([...order, ...allKeys])];
    const sorted = [];
    while (completeOrder.length) {
        const group = completeOrder.shift();
        const commandSet = commands.find(([key]) => key === group);
        if (commandSet) {
            sorted.push(commandSet);
        }
    }
    return sorted;
}
function getRawClone({ mods, ...config }) {
    // Configs should be fully serializable, so we can clone them without worrying about
    // the mods.
    return Object.freeze(JSON.parse(JSON.stringify(config)));
}
const orders = {
    ios: [
        // dangerous runs first
        'dangerous',
        // run the XcodeProject mod second because many plugins attempt to read from it.
        'xcodeproj',
    ],
};
/**
 * A generic plugin compiler.
 *
 * @param config
 */
async function evalModsAsync(config, { projectRoot, introspect, platforms, assertMissingModProviders, ignoreExistingNativeFiles = false, }) {
    const modRawConfig = getRawClone(config);
    for (const [platformName, platform] of Object.entries(config.mods ?? {})) {
        if (platforms && !platforms.includes(platformName)) {
            debug(`skip platform: ${platformName}`);
            continue;
        }
        let entries = Object.entries(platform);
        if (entries.length) {
            // Move dangerous item to the first position if it exists, this ensures that all dangerous code runs first.
            entries = sortMods(entries, orders[platformName] ?? ['dangerous']);
            debug(`run in order: ${entries.map(([name]) => name).join(', ')}`);
            const platformProjectRoot = path_1.default.join(projectRoot, platformName);
            const projectName = platformName === 'ios' ? (0, Xcodeproj_1.getHackyProjectName)(projectRoot, config) : undefined;
            for (const [modName, mod] of entries) {
                const modRequest = {
                    projectRoot,
                    projectName,
                    platformProjectRoot,
                    platform: platformName,
                    modName,
                    introspect: !!introspect,
                    ignoreExistingNativeFiles,
                };
                if (!mod.isProvider) {
                    // In strict mode, throw an error.
                    const errorMessage = `Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods`;
                    if (assertMissingModProviders !== false) {
                        throw new errors_1.PluginError(errorMessage, 'MISSING_PROVIDER');
                    }
                    else {
                        Warnings.addWarningForPlatform(platformName, `${platformName}.${modName}`, `Skipping: Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods. This may be due to an outdated version of Expo CLI.`);
                        // In loose mode, just skip the mod entirely.
                        continue;
                    }
                }
                const results = await mod({
                    ...config,
                    modResults: null,
                    modRequest,
                    modRawConfig,
                });
                // Sanity check to help locate non compliant mods.
                config = (0, createBaseMod_1.assertModResults)(results, platformName, modName);
                // @ts-ignore: `modResults` is added for modifications
                delete config.modResults;
                // @ts-ignore: `modRequest` is added for modifications
                delete config.modRequest;
                // @ts-ignore: `modRawConfig` is added for modifications
                delete config.modRawConfig;
            }
        }
    }
    return config;
}
exports.evalModsAsync = evalModsAsync;
