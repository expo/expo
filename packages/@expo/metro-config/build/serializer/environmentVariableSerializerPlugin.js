"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVarDevString = exports.environmentVariableSerializerPlugin = exports.serverPreludeSerializerPlugin = exports.getTransformEnvironment = void 0;
const CountingSet_1 = __importDefault(require("metro/src/lib/CountingSet"));
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const debug = require('debug')('expo:metro-config:serializer:env-var');
function getTransformEnvironment(url) {
    const match = url.match(/[&?]transform\.environment=([^&]+)/);
    return match ? match[1] : null;
}
exports.getTransformEnvironment = getTransformEnvironment;
function getAllExpoPublicEnvVars(inputEnv = process.env) {
    // Create an object containing all environment variables that start with EXPO_PUBLIC_
    const env = {};
    for (const key in inputEnv) {
        if (key.startsWith('EXPO_PUBLIC_')) {
            // @ts-expect-error: TS doesn't know that the key starts with EXPO_PUBLIC_
            env[key] = inputEnv[key];
        }
    }
    return env;
}
function isServerEnvironment(graph, options) {
    // Requests from a dev server will use sourceUrl.
    if (!graph.transformOptions.customTransformOptions) {
        if (options.sourceUrl) {
            const env = getTransformEnvironment(options.sourceUrl);
            return env === 'node' || env === 'react-server';
        }
        return false;
    }
    // Other requests will use customTransformOptions.environment.
    const env = graph.transformOptions.customTransformOptions.environment;
    return env === 'node' || env === 'react-server';
}
/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
function serverPreludeSerializerPlugin(entryPoint, preModules, graph, options) {
    if (isServerEnvironment(graph, options)) {
        const prelude = preModules.find((module) => module.path === '__prelude__');
        if (prelude) {
            debug('Stripping environment variable polyfill in server environment.');
            prelude.output[0].data.code = prelude.output[0].data.code
                .replace(/process=this\.process\|\|{},/, '')
                .replace(/process\.env=process\.env\|\|{};process\.env\.NODE_ENV=process\.env\.NODE_ENV\|\|"\w+";/, '');
        }
    }
    return [entryPoint, preModules, graph, options];
}
exports.serverPreludeSerializerPlugin = serverPreludeSerializerPlugin;
function environmentVariableSerializerPlugin(entryPoint, preModules, graph, options) {
    // Skip replacement in Node.js environments.
    if (isServerEnvironment(graph, options)) {
        debug('Skipping environment variable inlining in Node.js environment.');
        return [entryPoint, preModules, graph, options];
    }
    // In development, we need to add the process.env object to ensure it
    // persists between Fast Refresh updates.
    if (!options.dev) {
        debug('Skipping environment variable inlining in production environment in favor of babel-preset-expo inlining with source maps.');
        return [entryPoint, preModules, graph, options];
    }
    const code = getEnvVarDevString();
    const prelude = preModules.find((module) => module.path === '\0polyfill:environment-variables');
    if (prelude) {
        debug('Injecting environment variables in virtual module.');
        // !!MUST!! be one line in order to ensure Metro's asymmetric serializer system can handle it.
        prelude.output[0].data.code = code;
        return [entryPoint, preModules, graph, options];
    }
    // Old system which doesn't work very well since Metro doesn't serialize graphs the same way in all cases.
    // e.g. the `.map` endpoint is serialized differently to error symbolication.
    // Inject the new module at index 1
    // @ts-expect-error: The preModules are mutable and we need to mutate them in order to ensure the changes are applied outside of the serializer.
    preModules.splice(
    // Inject at index 1 to ensure it runs after the prelude (which injects env vars).
    1, 0, getEnvPrelude(code));
    return [entryPoint, preModules, graph, options];
}
exports.environmentVariableSerializerPlugin = environmentVariableSerializerPlugin;
function getEnvVarDevString(env = process.env) {
    // Set the process.env object to the current environment variables object
    // ensuring they aren't iterable, settable, or enumerable.
    const str = `process.env=Object.defineProperties(process.env, {` +
        Object.keys(getAllExpoPublicEnvVars(env))
            .map((key) => `${JSON.stringify(key)}: { value: ${JSON.stringify(env[key])} }`)
            .join(',') +
        '});';
    const code = '/* HMR env vars from Expo CLI (dev-only) */ ' + str;
    const lineCount = (0, countLines_1.default)(code);
    if (lineCount !== 1) {
        throw new Error(`Virtual environment variable code must be one line, got "${lineCount}" lines.`);
    }
    return code;
}
exports.getEnvVarDevString = getEnvVarDevString;
function getEnvPrelude(code) {
    const name = `\0polyfill:environment-variables`;
    return {
        dependencies: new Map(),
        getSource: () => Buffer.from(code),
        inverseDependencies: new CountingSet_1.default(),
        path: name,
        output: [
            {
                type: 'js/script/virtual',
                data: {
                    code,
                    lineCount: 1,
                    map: [],
                },
            },
        ],
    };
}
//# sourceMappingURL=environmentVariableSerializerPlugin.js.map