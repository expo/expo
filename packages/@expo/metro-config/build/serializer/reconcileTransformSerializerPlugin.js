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
exports.createPostTreeShakeTransformSerializerPlugin = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const core_1 = require("@babel/core");
const generator_1 = __importDefault(require("@babel/generator"));
const assert_1 = __importDefault(require("assert"));
const JsFileWrapping_1 = __importDefault(require("metro/src/ModuleGraph/worker/JsFileWrapping"));
const collectDependencies_1 = __importStar(require("metro/src/ModuleGraph/worker/collectDependencies"));
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const metro_source_map_1 = require("metro-source-map");
const metro_transform_plugins_1 = __importDefault(require("metro-transform-plugins"));
const getMinifier_1 = __importDefault(require("metro-transform-worker/src/utils/getMinifier"));
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
const metro_transform_worker_1 = require("../transform-worker/metro-transform-worker");
const debug = require('debug')('expo:treeshaking');
class InvalidRequireCallError extends Error {
    innerError;
    filename;
    constructor(innerError, filename) {
        super(`${filename}:${innerError.message}`);
        this.innerError = innerError;
        this.filename = filename;
    }
}
function assertCollectDependenciesOptions(collectDependenciesOptions) {
    if (!collectDependenciesOptions) {
        throw new Error('collectDependenciesOptions is required. Something is wrong with the metro transformer or transform cache.');
    }
    if (typeof collectDependenciesOptions !== 'object') {
        throw new Error('collectDependenciesOptions must be an object.');
    }
    (0, assert_1.default)('unstable_allowRequireContext' in collectDependenciesOptions, 'unstable_allowRequireContext is required.');
    (0, assert_1.default)('allowOptionalDependencies' in collectDependenciesOptions, 'allowOptionalDependencies is required.');
    (0, assert_1.default)('asyncRequireModulePath' in collectDependenciesOptions, 'asyncRequireModulePath is required.');
    (0, assert_1.default)('dynamicRequires' in collectDependenciesOptions, 'dynamicRequires is required.');
    (0, assert_1.default)('inlineableCalls' in collectDependenciesOptions, 'inlineableCalls is required.');
    (0, assert_1.default)('keepRequireNames' in collectDependenciesOptions, 'keepRequireNames is required.');
    (0, assert_1.default)('dependencyMapName' in collectDependenciesOptions, 'dependencyMapName is required.');
}
// This is the insane step which reconciles the second half of the transformation process but it does it uncached at the end of the bundling process when we have tree shaking completed.
function createPostTreeShakeTransformSerializerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        // console.log('treeshake:', graph.transformOptions, isShakingEnabled(graph, options));
        if (!(0, treeShakeSerializerPlugin_1.isShakingEnabled)(graph, options)) {
            return [entryPoint, preModules, graph, options];
        }
        // return [entryPoint, preModules, graph, options];
        // const includeDebugInfo = false;
        const preserveEsm = false;
        // Convert all remaining AST and dependencies to standard output that Metro expects.
        // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
        for (const value of graph.dependencies.values()) {
            // if (value.path.includes('empty-module.js')) {
            //   inspect(value);
            // }
            for (const index in value.output) {
                const outputItem = value.output[index];
                if (outputItem.type !== 'js/module' || value.path.endsWith('.json')) {
                    debug('Skipping post transform for non-js/module: ' + value.path);
                    continue;
                }
                // @ts-expect-error: TODO
                const minify = outputItem.data.minify;
                // This should be cached by the transform worker for use here to ensure close to consistent
                // results between the tree-shake and the final transform.
                // @ts-expect-error: TODO
                const collectDependenciesOptions = outputItem.data.collectDependenciesOptions;
                assertCollectDependenciesOptions(collectDependenciesOptions);
                // if (!collectDependenciesOptions) {
                //   debug('Skipping post transform for module: ' + value.path);
                //   continue;
                // }
                let ast = (0, treeShakeSerializerPlugin_1.accessAst)(outputItem);
                if (!ast) {
                    continue;
                }
                // console.log('AST:', value.path);
                // console.log(require('@babel/generator').default(ast).code);
                // NOTE: ^^ Only modules are being parsed to ast right now.
                // @ts-expect-error: TODO
                delete outputItem.data.ast;
                // console.log('treeshake!!:', value.path, outputItem.data.collectDependenciesOptions);
                const importDefault = collectDependenciesOptions.inlineableCalls[0];
                const importAll = collectDependenciesOptions.inlineableCalls[1];
                // const { importDefault, importAll } = generateImportNames(ast);
                const babelPluginOpts = {
                    // ...options,
                    ...graph.transformOptions,
                    // inlinePlatform: true,
                    // minify: false,
                    // platform: 'web',
                    // unstable_transformProfile: 'default',
                    // experimentalImportSupport: false,
                    // unstable_disableES6Transforms: false,
                    // nonInlinedRequires: [ 'React', 'react', 'react-native' ],
                    // type: 'module',
                    // inlineRequires: false,
                    inlineableCalls: [importDefault, importAll],
                    importDefault,
                    importAll,
                };
                // @ts-expect-error: TODO
                ast = (0, core_1.transformFromAstSync)(ast, undefined, {
                    ast: true,
                    babelrc: false,
                    code: false,
                    configFile: false,
                    // comments: includeDebugInfo,
                    // compact: false,
                    filename: value.path,
                    plugins: [
                        // functionMapBabelPlugin,
                        metro_transform_worker_1.renameTopLevelModuleVariables,
                        !preserveEsm && [metro_transform_plugins_1.default.importExportPlugin, babelPluginOpts],
                        // TODO: Inline requires matchers
                        // dynamicTransformOptions?.transform?.inlineRequires && [
                        //   require('metro-transform-plugins/src/inline-plugin'),
                        //   babelPluginOpts,
                        // ],
                    ].filter(Boolean),
                    sourceMaps: false,
                    // // Not-Cloning the input AST here should be safe because other code paths above this call
                    // // are mutating the AST as well and no code is depending on the original AST.
                    // // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                    // // either because one of the plugins is doing something funky or Babel messes up some caches.
                    // // Make sure to test the above mentioned case before flipping the flag back to false.
                    // cloneInputAst: true,
                })?.ast;
                // TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
                let dependencyMapName = '';
                let dependencies;
                // This pass converts the modules to use the generated import names.
                try {
                    const opts = collectDependenciesOptions;
                    // TODO: We should try to drop this black-box approach since we don't need the deps.
                    // We just need the AST modifications such as `require.context`.
                    // console.log(require('@babel/generator').default(ast).code);
                    ({ ast, dependencies, dependencyMapName } = (0, collectDependencies_1.default)(ast, {
                        ...opts,
                        // This setting shouldn't be shared + it can't be serialized and cached anyways.
                        dependencyTransformer: null,
                    }));
                }
                catch (error) {
                    if (error instanceof collectDependencies_1.InvalidRequireCallError) {
                        throw new InvalidRequireCallError(error, value.path);
                    }
                    throw error;
                }
                // Some imports may change order during the transform, so we need to resort them.
                // Resort the dependencies to match the current order of the AST.
                const nextDependencies = new Map();
                // Metro uses this Map hack so we need to create a new map and add the items in the expected order/
                dependencies.forEach((dep) => {
                    nextDependencies.set(dep.data.key, {
                        ...(value.dependencies.get(dep.data.key) || {}),
                        data: dep,
                    });
                });
                // @ts-expect-error: Mutating the value in place.
                value.dependencies = nextDependencies;
                // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L107
                const globalPrefix = config.transformer?.globalPrefix ?? '';
                let wrappedAst;
                try {
                    const results = JsFileWrapping_1.default.wrapModule(ast, importDefault, importAll, dependencyMapName, 
                    // TODO: Share these with transformer
                    globalPrefix, config.transformer?.unstable_renameRequire === false);
                    wrappedAst = results.ast;
                }
                catch (error) {
                    // This can throw if there's a top-level declaration of a variable named "module".
                    // If the error is a SyntaxError then parse and throw a proper babel error.
                    // console.log('Error wrapping module:', value.path);
                    // console.log(generate(ast).code);
                    throw error;
                }
                const source = value.getSource().toString('utf-8');
                const reserved = [];
                if (config.transformer?.unstable_dependencyMapReservedName != null) {
                    reserved.push(config.transformer.unstable_dependencyMapReservedName);
                }
                // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L128C28-L128C38
                const optimizationSizeLimit = config.transformer?.optimizationSizeLimit ?? 150 * 1024;
                if (minify &&
                    source.length <= optimizationSizeLimit &&
                    !config.transformer?.unstable_disableNormalizePseudoGlobals) {
                    // This MUST run before `generate` as it mutates the ast out of place.
                    reserved.push(...metro_transform_plugins_1.default.normalizePseudoGlobals(wrappedAst, {
                        reservedNames: reserved,
                    }));
                }
                const result = (0, generator_1.default)(wrappedAst, {
                    // comments: true,
                    // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L137
                    compact: config.transformer?.unstable_compactOutput ?? false,
                    filename: value.path,
                    retainLines: false,
                    sourceFileName: value.path,
                    sourceMaps: true,
                }, outputItem.data.code);
                let map = result.rawMappings ? result.rawMappings.map(metro_source_map_1.toSegmentTuple) : [];
                let code = result.code;
                if (minify && !preserveEsm) {
                    ({ map, code } = await minifyCode(config.transformer ?? {}, config.projectRoot, value.path, result.code, source, map, reserved));
                    // console.log('module', code);
                }
                outputItem.data = {
                    ...outputItem.data,
                    code,
                    map,
                    lineCount: (0, countLines_1.default)(code),
                    functionMap: 
                    // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
                    ast.metadata?.metro?.functionMap ??
                        // @ts-expect-error: Fallback to deprecated explicitly-generated `functionMap`
                        ast.functionMap ??
                        null,
                };
            }
        }
        return [entryPoint, preModules, graph, options];
    };
}
exports.createPostTreeShakeTransformSerializerPlugin = createPostTreeShakeTransformSerializerPlugin;
// TODO: Rework all of this to share logic with the transformer. Also account for not minifying in hermes bundles.
async function minifyCode(config, projectRoot, filename, code, source, map, reserved = []) {
    const sourceMap = (0, metro_source_map_1.fromRawMappings)([
        {
            code,
            source,
            map,
            // functionMap is overridden by the serializer
            functionMap: null,
            path: filename,
            // isIgnored is overriden by the serializer
            isIgnored: false,
        },
    ]).toMap(undefined, {});
    // https://github.com/facebook/metro/blob/d1b0015d5a41ad1a1e1e78661805b692c34457db/packages/metro-config/src/defaults/defaults.js#L66
    const minify = (0, getMinifier_1.default)(config.minifierPath ?? 'metro-minify-terser');
    try {
        // console.log('reserved', reserved, code);
        const minified = await minify({
            code,
            map: sourceMap,
            filename,
            reserved,
            // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L109-L126
            config: config.minifierConfig ?? {
                mangle: {
                    toplevel: false,
                },
                output: {
                    ascii_only: true,
                    quote_style: 3,
                    wrap_iife: true,
                },
                sourceMap: {
                    includeSources: false,
                },
                toplevel: false,
                compress: {
                    // reduce_funcs inlines single-use functions, which cause perf regressions.
                    reduce_funcs: false,
                },
            },
        });
        return {
            code: minified.code,
            map: minified.map ? (0, metro_source_map_1.toBabelSegments)(minified.map).map(metro_source_map_1.toSegmentTuple) : [],
        };
    }
    catch (error) {
        if (error.constructor.name === 'JS_Parse_Error') {
            throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
        }
        throw error;
    }
}
// const minifyCode = async (
//   config: JsTransformerConfig,
//   projectRoot: string,
//   filename: string,
//   code: string,
//   source: string,
//   map: MetroSourceMapSegmentTuple[],
//   reserved: string[] = []
// ): Promise<{
//   code: string;
//   map: MetroSourceMapSegmentTuple[];
// }> => {
//   const sourceMap = fromRawMappings([
//     {
//       code,
//       source,
//       map,
//       // functionMap is overridden by the serializer
//       functionMap: null,
//       path: filename,
//       // isIgnored is overriden by the serializer
//       isIgnored: false,
//     },
//   ]).toMap(undefined, {});
//   const minify = getMinifier(config.minifierPath);
//   try {
//     const minified = await minify({
//       code,
//       map: sourceMap,
//       filename,
//       reserved,
//       config: config.minifierConfig,
//     });
//     return {
//       code: minified.code,
//       map: minified.map ? toBabelSegments(minified.map).map(toSegmentTuple) : [],
//     };
//   } catch (error: any) {
//     if (error.constructor.name === 'JS_Parse_Error') {
//       throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
//     }
//     throw error;
//   }
// };
//# sourceMappingURL=reconcileTransformSerializerPlugin.js.map