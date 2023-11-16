"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGeneratedBaseMods = exports.provider = exports.createPlatformBaseMod = exports.assertModResults = exports.createBaseMod = void 0;
const debug_1 = __importDefault(require("debug"));
const withMod_1 = require("./withMod");
const debug = (0, debug_1.default)('expo:config-plugins:base-mods');
function createBaseMod({ methodName, platform, modName, getFilePath, read, write, isIntrospective, }) {
    const withUnknown = (config, _props) => {
        const props = _props || {};
        return (0, withMod_1.withBaseMod)(config, {
            platform,
            mod: modName,
            skipEmptyMod: props.skipEmptyMod ?? true,
            saveToInternal: props.saveToInternal ?? false,
            isProvider: true,
            isIntrospective,
            async action({ modRequest: { nextMod, ...modRequest }, ...config }) {
                try {
                    let results = {
                        ...config,
                        modRequest,
                    };
                    const filePath = await getFilePath(results, props);
                    debug(`mods.${platform}.${modName}: file path: ${filePath || '[skipped]'}`);
                    const modResults = await read(filePath, results, props);
                    results = await nextMod({
                        ...results,
                        modResults,
                        modRequest,
                    });
                    assertModResults(results, modRequest.platform, modRequest.modName);
                    await write(filePath, results, props);
                    return results;
                }
                catch (error) {
                    error.message = `[${platform}.${modName}]: ${methodName}: ${error.message}`;
                    throw error;
                }
            },
        });
    };
    if (methodName) {
        Object.defineProperty(withUnknown, 'name', {
            value: methodName,
        });
    }
    return withUnknown;
}
exports.createBaseMod = createBaseMod;
function assertModResults(results, platformName, modName) {
    // If the results came from a mod, they'd be in the form of [config, data].
    // Ensure the results are an array and omit the data since it should've been written by a data provider plugin.
    const ensuredResults = results;
    // Sanity check to help locate non compliant mods.
    if (!ensuredResults || typeof ensuredResults !== 'object' || !ensuredResults?.mods) {
        throw new Error(`Mod \`mods.${platformName}.${modName}\` evaluated to an object that is not a valid project config. Instead got: ${JSON.stringify(ensuredResults)}`);
    }
    return ensuredResults;
}
exports.assertModResults = assertModResults;
function upperFirst(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}
function createPlatformBaseMod({ modName, ...props }) {
    // Generate the function name to ensure it's uniform and also to improve stack traces.
    const methodName = `with${upperFirst(props.platform)}${upperFirst(modName)}BaseMod`;
    return createBaseMod({
        methodName,
        modName,
        ...props,
    });
}
exports.createPlatformBaseMod = createPlatformBaseMod;
/** A TS wrapper for creating provides */
function provider(props) {
    return props;
}
exports.provider = provider;
/** Plugin to create and append base mods from file providers */
function withGeneratedBaseMods(config, { platform, providers, ...props }) {
    return Object.entries(providers).reduce((config, [modName, value]) => {
        const baseMod = createPlatformBaseMod({ platform, modName, ...value });
        return baseMod(config, props);
    }, config);
}
exports.withGeneratedBaseMods = withGeneratedBaseMods;
