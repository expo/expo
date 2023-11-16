"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeAfterStaticPlugins = exports.serializeSkippingMods = exports.serializeAndEvaluate = void 0;
const Errors_1 = require("./Errors");
function serializeAndEvaluate(val) {
    if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
        return val;
    }
    else if (typeof val === 'function') {
        // TODO: Bacon: Should we support async methods?
        return val();
    }
    else if (Array.isArray(val)) {
        return val.map(serializeAndEvaluate);
    }
    else if (typeof val === 'object') {
        const output = {};
        for (const property in val) {
            if (val.hasOwnProperty(property)) {
                output[property] = serializeAndEvaluate(val[property]);
            }
        }
        return output;
    }
    // symbol
    throw new Errors_1.ConfigError(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}
exports.serializeAndEvaluate = serializeAndEvaluate;
function serializeSkippingMods(val) {
    if (typeof val === 'object' && !Array.isArray(val)) {
        const output = {};
        for (const property in val) {
            if (val.hasOwnProperty(property)) {
                if (property === 'mods' || property === 'plugins') {
                    // Don't serialize mods or plugins
                    output[property] = val[property];
                }
                else {
                    output[property] = serializeAndEvaluate(val[property]);
                }
            }
        }
        return output;
    }
    return serializeAndEvaluate(val);
}
exports.serializeSkippingMods = serializeSkippingMods;
function serializeAndEvaluatePlugin(val) {
    if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
        return val;
    }
    else if (typeof val === 'function') {
        return val.name || 'withAnonymous';
    }
    else if (Array.isArray(val)) {
        return val.map(serializeAndEvaluatePlugin);
    }
    else if (typeof val === 'object') {
        const output = {};
        for (const property in val) {
            if (val.hasOwnProperty(property)) {
                output[property] = serializeAndEvaluatePlugin(val[property]);
            }
        }
        return output;
    }
    // symbol
    throw new Errors_1.ConfigError(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}
function serializeAfterStaticPlugins(val) {
    if (typeof val === 'object' && !Array.isArray(val)) {
        const output = {};
        for (const property in val) {
            if (val.hasOwnProperty(property)) {
                if (property === 'mods') {
                    // Don't serialize mods
                    output[property] = val[property];
                }
                else if (property === 'plugins' && Array.isArray(val[property])) {
                    // Serialize the mods by removing any config plugins
                    output[property] = val[property].map(serializeAndEvaluatePlugin);
                }
                else {
                    output[property] = serializeAndEvaluate(val[property]);
                }
            }
        }
        return output;
    }
    return serializeAndEvaluate(val);
}
exports.serializeAfterStaticPlugins = serializeAfterStaticPlugins;
