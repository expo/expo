"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const jsc_safe_url_1 = require("jsc-safe-url");
const baseJSBundle_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/baseJSBundle"));
// @ts-expect-error
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const path_1 = __importDefault(require("path"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const getCssDeps_1 = require("./getCssDeps");
const env_1 = require("../env");
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    return withSerializerPlugins(config, processors);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors) {
    const originalSerializer = config.serializer?.customSerializer;
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
const core_1 = require("@babel/core");
const generateImportNames = require('metro/src/ModuleGraph/worker/generateImportNames');
const JsFileWrapping = require('metro/src/ModuleGraph/worker/JsFileWrapping');
function getDefaultSerializer(fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.default)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [entryPoint, preModules, graph, options] = props;
        for (const value of graph.dependencies.values()) {
            console.log('inverseDependencies', value.inverseDependencies.values());
            for (const index in value.output) {
                const outputItem = value.output[index];
                // modules: {
                //   imports: [],
                //   exports: [
                //     { specifiers: [ 'add' ] },
                //     { specifiers: [ 'subtract' ] }
                //   ]
                // },
                let exports = outputItem.data.modules?.exports;
                let usedExports = [];
                // Collect a list of all the unused exports by traversing inverse
                // dependencies.
                for (const inverseDepId of value.inverseDependencies.values()) {
                    const inverseDep = graph.dependencies.get(inverseDepId);
                    if (!inverseDep) {
                        continue;
                    }
                    inverseDep.output.forEach((outputItem) => {
                        if (outputItem.type === 'js/module') {
                            // imports: [
                            //   {
                            //     source: './math',
                            //     specifiers: [
                            //       {
                            //         type: 'ImportSpecifier',
                            //         importedName: 'add',
                            //         localName: 'add'
                            //       }
                            //     ]
                            //   }
                            // ],
                            const imports = outputItem.data.modules?.imports;
                            if (imports) {
                                imports.forEach((importItem) => {
                                    console.log('importItem', importItem);
                                    // TODO: Use proper keys for identifying the import.
                                    if (
                                    // '/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/math.js'
                                    value.path.includes(
                                    // './math'
                                    importItem.source.replace('./', ''))) {
                                        importItem.specifiers.forEach((specifier) => {
                                            usedExports.push(specifier.importedName);
                                        });
                                    }
                                });
                            }
                        }
                    });
                    // TODO: This probably breaks source maps.
                    // const code = transformFromAstSync(value.output[index].data.ast);
                    // replaceEnvironmentVariables(value.output[index].data.code, process.env);
                    // value.output[index].data.code = code;
                }
                // Remove the unused exports from the list of ast exports.
                let ast = outputItem.data.ast;
                if (usedExports.length > 0) {
                    console.log('has used exports:', usedExports);
                    (0, core_1.traverse)(ast, {
                        ExportNamedDeclaration(path) {
                            // If the export is not used, remove it.
                            if (!usedExports.includes(path.node.declaration.id.name)) {
                                console.log('drop export:', path.node.declaration.id.name, usedExports);
                                path.remove();
                                // TODO: Determine if additional code needs to be removed based on the export.
                            }
                        },
                    });
                }
                const { importDefault, importAll } = generateImportNames(ast);
                const babelPluginOpts = {
                    // ...options,
                    inlineableCalls: [importDefault, importAll],
                    importDefault,
                    importAll,
                };
                ast = (0, core_1.transformFromAstSync)(ast, undefined, {
                    ast: true,
                    babelrc: false,
                    code: false,
                    configFile: false,
                    comments: false,
                    compact: true,
                    filename: value.path,
                    plugins: [
                        [require('metro-transform-plugins/src/import-export-plugin'), babelPluginOpts],
                        [require('metro-transform-plugins/src/inline-plugin'), babelPluginOpts],
                    ],
                    sourceMaps: false,
                    // Not-Cloning the input AST here should be safe because other code paths above this call
                    // are mutating the AST as well and no code is depending on the original AST.
                    // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // Make sure to test the above mentioned case before flipping the flag back to false.
                    cloneInputAst: true,
                })?.ast;
                let dependencyMapName = '';
                let globalPrefix = '';
                let { ast: wrappedAst } = JsFileWrapping.wrapModule(ast, importDefault, importAll, dependencyMapName, globalPrefix);
                outputItem.data.code = (0, core_1.transformFromAstSync)(wrappedAst, undefined, {
                    ast: false,
                    babelrc: false,
                    code: true,
                    configFile: false,
                    comments: false,
                    compact: true,
                    filename: value.path,
                    plugins: [],
                    sourceMaps: false,
                    // Not-Cloning the input AST here should be safe because other code paths above this call
                    // are mutating the AST as well and no code is depending on the original AST.
                    // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // Make sure to test the above mentioned case before flipping the flag back to false.
                    cloneInputAst: true,
                })?.code;
                outputItem.data.lineCount = outputItem.data.code.split('\n').length;
                outputItem.data.map = null;
                outputItem.data.functionMap = null;
                // TODO: minify the code to fold anything that was dropped above.
                console.log('output code', outputItem.data.code);
            }
        }
        console.log(require('util').inspect({ entryPoint, graph, options }, { depth: 20, colors: true }));
        const jsCode = await defaultSerializer(entryPoint, preModules, graph, options);
        console.log('OUTPUT CODE', jsCode);
        if (!options.sourceUrl) {
            return jsCode;
        }
        const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
            ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
            : options.sourceUrl;
        const url = new URL(sourceUrl, 'https://expo.dev');
        if (url.searchParams.get('platform') !== 'web' ||
            url.searchParams.get('serializer.output') !== 'static') {
            // Default behavior if `serializer.output=static` is not present in the URL.
            return jsCode;
        }
        const includeSourceMaps = url.searchParams.get('serializer.map') === 'true';
        const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
            projectRoot: options.projectRoot,
            processModuleFilter: options.processModuleFilter,
        });
        const jsAssets = [];
        if (jsCode) {
            const stringContents = typeof jsCode === 'string' ? jsCode : jsCode.code;
            const jsFilename = (0, getCssDeps_1.fileNameFromContents)({
                filepath: url.pathname,
                src: stringContents,
            });
            jsAssets.push({
                filename: options.dev ? 'index.js' : `_expo/static/js/web/${jsFilename}.js`,
                originFilename: 'index.js',
                type: 'js',
                metadata: {},
                source: stringContents,
            });
            if (
            // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
            includeSourceMaps &&
                options.sourceMapUrl) {
                const sourceMap = typeof jsCode === 'string' ? serializeToSourceMap(...props) : jsCode.map;
                // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
                const parsed = JSON.parse(sourceMap);
                // TODO: Maybe we can do this earlier.
                parsed.sources = parsed.sources.map(
                // TODO: Maybe basePath support
                (value) => {
                    if (value.startsWith('/')) {
                        return '/' + path_1.default.relative(options.serverRoot ?? options.projectRoot, value);
                    }
                    // Prevent `__prelude__` from being relative.
                    return value;
                });
                jsAssets.push({
                    filename: options.dev ? 'index.map' : `_expo/static/js/web/${jsFilename}.js.map`,
                    originFilename: 'index.map',
                    type: 'map',
                    metadata: {},
                    source: JSON.stringify(parsed),
                });
            }
        }
        return JSON.stringify([...jsAssets, ...cssDeps]);
    };
}
function getSortedModules(graph, { createModuleId, }) {
    const modules = [...graph.dependencies.values()];
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
function serializeToSourceMap(...props) {
    const [, prepend, graph, options] = props;
    const modules = [
        ...prepend,
        ...getSortedModules(graph, {
            createModuleId: options.createModuleId,
        }),
    ];
    return (0, sourceMapString_1.default)(modules, {
        ...options,
    });
}
function createSerializerFromSerialProcessors(processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(originalSerializer);
    return (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
