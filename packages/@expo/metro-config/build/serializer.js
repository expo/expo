"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendLinkToHtml = exports.htmlFromSerialAssets = exports.writeSerialAssets = exports.createSerializerFromSerialProcessors = exports.withSerialProcessors = exports.withExpoSerializers = exports.serializeWithEnvironmentVariables = exports.getTransformEnvironment = exports.replaceEnvironmentVariables = void 0;
const baseJSBundle_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./env");
const getCssDeps_1 = require("./getCssDeps");
const debug = require('debug')('expo:metro-config:serializer');
function replaceEnvironmentVariables(code, env) {
    // match and replace env variables that aren't NODE_ENV or JEST_WORKER_ID
    // return code.match(/process\.env\.(EXPO_PUBLIC_[A-Z_]+)/g);
    return code.replace(/process\.env\.([a-zA-Z0-9_]+)/gm, (match) => {
        const name = match.replace('process.env.', '');
        if (
        // Must start with EXPO_PUBLIC_ to be replaced
        !/^EXPO_PUBLIC_/.test(name)) {
            return match;
        }
        const value = JSON.stringify(env[name] ?? '');
        debug(`Inlining environment variable "${match}" with ${value}`);
        return value;
    });
}
exports.replaceEnvironmentVariables = replaceEnvironmentVariables;
function getTransformEnvironment(url) {
    const match = url.match(/[&?]transform\.environment=([^&]+)/);
    return match ? match[1] : null;
}
exports.getTransformEnvironment = getTransformEnvironment;
function getAllExpoPublicEnvVars() {
    // Create an object containing all environment variables that start with EXPO_PUBLIC_
    const env = {};
    for (const key in process.env) {
        if (key.startsWith('EXPO_PUBLIC_')) {
            // @ts-ignore
            env[key] = process.env[key];
        }
    }
    return env;
}
function serializeWithEnvironmentVariables(entryPoint, preModules, graph, options) {
    // Skip replacement in Node.js environments.
    if (options.sourceUrl && getTransformEnvironment(options.sourceUrl) === 'node') {
        debug('Skipping environment variable inlining in Node.js environment.');
        return [entryPoint, preModules, graph, options];
    }
    // Adds about 5ms on a blank Expo Router app.
    // TODO: We can probably cache the results.
    // In development, we need to add the process.env object to ensure it
    // persists between Fast Refresh updates.
    if (options.dev) {
        // Set the process.env object to the current environment variables object
        // ensuring they aren't iterable, settable, or enumerable.
        const str = `process.env=Object.defineProperties(process.env, {${Object.keys(getAllExpoPublicEnvVars())
            .map((key) => `${JSON.stringify(key)}: { value: ${JSON.stringify(process.env[key])} }`)
            .join(',')}});`;
        const [firstModule, ...restModules] = preModules;
        // const envCode = `var process=this.process||{};${str}`;
        // process.env
        return [
            entryPoint,
            [
                // First module defines the process.env object.
                firstModule,
                // Second module modifies the process.env object.
                getEnvPrelude(str),
                // Now we add the rest
                ...restModules,
            ],
            graph,
            options,
        ];
    }
    // In production, inline all process.env variables to ensure they cannot be iterated and read arbitrarily.
    for (const value of graph.dependencies.values()) {
        // Skip node_modules, the feature is a bit too sensitive to allow in arbitrary code.
        if (/node_modules/.test(value.path)) {
            continue;
        }
        for (const index in value.output) {
            // TODO: This probably breaks source maps.
            const code = replaceEnvironmentVariables(value.output[index].data.code, process.env);
            value.output[index].data.code = code;
        }
    }
    return [entryPoint, preModules, graph, options];
}
exports.serializeWithEnvironmentVariables = serializeWithEnvironmentVariables;
function getEnvPrelude(contents) {
    const code = '// HMR env vars from Expo CLI (dev-only)\n' + contents;
    const name = '__env__';
    return {
        dependencies: new Map(),
        getSource: () => Buffer.from(code),
        inverseDependencies: new Set(),
        path: name,
        output: [
            {
                type: 'js/script/virtual',
                data: {
                    code,
                    lineCount: (0, countLines_1.default)(code),
                    map: [],
                },
            },
        ],
    };
}
function withExpoSerializers(config) {
    const processors = [];
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(serializeWithEnvironmentVariables);
    }
    return withSerialProcessors(config, processors);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerialProcessors(config, processors) {
    const originalSerializer = config.serializer?.customSerializer;
    if (originalSerializer) {
        console.warn('Custom Metro serializers are not supported with Expo CLI.');
    }
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
        },
    };
}
exports.withSerialProcessors = withSerialProcessors;
function getDefaultSerializer() {
    return (...props) => {
        const bundle = (0, baseJSBundle_1.default)(...props);
        const [, , graph, options] = props;
        if (!options.sourceUrl) {
            return (0, bundleToString_1.default)(bundle).code;
        }
        const url = new URL(options.sourceUrl, 'https://expo.dev');
        if (url.searchParams.get('platform') !== 'web' || url.searchParams.get('_type') !== 'html') {
            // Default behavior if `_type=html` is not present in the URL.
            return (0, bundleToString_1.default)(bundle).code;
        }
        const cssDeps = (0, getCssDeps_1.getCssModules)(graph.dependencies, {
            projectRoot: options.projectRoot,
            processModuleFilter: options.processModuleFilter,
        });
        const jsCode = (0, bundleToString_1.default)(bundle).code;
        const jsAsset = {
            filename: options.dev
                ? 'index.js'
                : `_expo/static/js/web/${(0, getCssDeps_1.fileNameFromContents)({
                    filepath: url.pathname,
                    src: jsCode,
                })}.js`,
            originFilename: 'index.js',
            type: 'js',
            metadata: {},
            source: jsCode,
        };
        return JSON.stringify([jsAsset, ...cssDeps]);
    };
}
function createSerializerFromSerialProcessors(processors, serializer) {
    return (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = processor(...props);
            }
        }
        const finalSerializer = getDefaultSerializer();
        // const finalSerializer = serializer ?? getDefaultSerializer();
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
const fs_1 = __importDefault(require("fs"));
function writeSerialAssets(assets, { outputDir }) {
    assets.forEach((asset) => {
        const output = path_1.default.join(outputDir, asset.filename);
        fs_1.default.mkdirSync(path_1.default.dirname(output), { recursive: true });
        fs_1.default.writeFileSync(output, asset.source);
    });
}
exports.writeSerialAssets = writeSerialAssets;
function htmlFromSerialAssets(assets, { dev, template, bundleUrl }) {
    // Combine the CSS modules into tags that have hot refresh data attributes.
    const styleString = assets
        .filter((asset) => asset.type === 'css')
        .map(({ metadata, filename, source }) => {
        if (dev) {
            // TODO: No data id in prod
            return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
        }
        else {
            return [
                `<link rel="preload" href="${filename}" as="style">`,
                `<link rel="stylesheet" href="${filename}">`,
            ].join('');
        }
    })
        .join('');
    const jsAssets = assets.filter((asset) => asset.type === 'js');
    const scripts = bundleUrl
        ? `<script src="${bundleUrl}"></script>`
        : jsAssets
            .map(({ filename }) => {
            return `<script src="${filename}"></script>`;
        })
            .join('');
    // const script = '<script>' + bundleToString(bundle).code + '\n</script>';
    if (template) {
        return template
            .replace('</head>', `${styleString}</head>`)
            .replace('</body>', `${scripts}</body>`);
    }
    // TODO: Render this statically
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover">
    <style data-id="expo-reset">#root,body{display:flex}#root,body,html{width:100%;-webkit-overflow-scrolling:touch;margin:0;padding:0;min-height:100%}#root{flex-shrink:0;flex-basis:auto;flex-grow:1;flex:1}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;height:calc(100% + env(safe-area-inset-top))}body{overflow-y:auto;overscroll-behavior-y:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-ms-overflow-style:scrollbar}</style>
    ${styleString}
  </head>
  <body>
    <div id="root"></div>
    ${scripts}
  </body>
</html>`;
}
exports.htmlFromSerialAssets = htmlFromSerialAssets;
// <link rel="preload" href="/_expo/static/css/xxxxxx.css" as="style">
function appendLinkToHtml(html, links) {
    return html.replace('</head>', links
        .map((link) => {
        let linkTag = `<link rel="${link.rel}"`;
        if (link.href)
            linkTag += ` href="${link.href}"`;
        if (link.as)
            linkTag += ` as="${link.as}"`;
        linkTag += '>';
        return linkTag;
    })
        .join('') + '</head>');
}
exports.appendLinkToHtml = appendLinkToHtml;
