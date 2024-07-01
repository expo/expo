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
exports.createReconcileTransformerPlugin = void 0;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const generator_1 = __importDefault(require("@babel/generator"));
const assert_1 = __importDefault(require("assert"));
const JsFileWrapping_1 = __importDefault(require("metro/src/ModuleGraph/worker/JsFileWrapping"));
const collectDependencies_1 = __importStar(require("metro/src/ModuleGraph/worker/collectDependencies"));
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const metro_source_map_1 = require("metro-source-map");
const metro_transform_plugins_1 = __importDefault(require("metro-transform-plugins"));
const sideEffects_1 = require("./sideEffects");
const treeShakeSerializerPlugin_1 = require("./treeShakeSerializerPlugin");
const metro_transform_worker_1 = require("../transform-worker/metro-transform-worker");
const debug = require('debug')('expo:treeshaking');
const FORCE_REQUIRE_NAME_HINTS = false;
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
    (0, assert_1.default)('inlineableCalls' in collectDependenciesOptions, 'inlineableCalls is required.');
}
// This is the insane step which reconciles the second half of the transformation process but it does it uncached at the end of the bundling process when we have tree shaking completed.
function createReconcileTransformerPlugin(config) {
    return async function treeShakeSerializer(entryPoint, preModules, graph, options) {
        if (!(0, treeShakeSerializerPlugin_1.isShakingEnabled)(graph, options)) {
            return [entryPoint, preModules, graph, options];
        }
        // Convert all remaining AST and dependencies to standard output that Metro expects.
        // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
        for (const value of graph.dependencies.values()) {
            for (const index in value.output) {
                // @ts-expect-error: Typed as readonly
                value.output[index] = await transformDependencyOutput(value, value.output[index]);
            }
        }
        return [entryPoint, preModules, graph, options];
        async function transformDependencyOutput(value, outputItem) {
            if (outputItem.type !== 'js/module' || value.path.endsWith('.json')) {
                debug('Skipping post transform for non-js/module: ' + value.path);
                return outputItem;
            }
            // This should be cached by the transform worker for use here to ensure close to consistent
            // results between the tree-shake and the final transform.
            // @ts-expect-error: reconcile object is not on the type.
            const reconcile = outputItem.data.reconcile;
            (0, assert_1.default)(reconcile, 'reconcile settings are required in the module graph for post transform.');
            assertCollectDependenciesOptions(reconcile.collectDependenciesOptions);
            let ast = (0, treeShakeSerializerPlugin_1.accessAst)(outputItem);
            if (!ast) {
                throw new Error('missing AST for ' + value.path);
            }
            // @ts-expect-error: TODO
            delete outputItem.data.ast;
            const { importDefault, importAll } = reconcile;
            const sideEffectReferences = [...value.dependencies.values()]
                .filter((dep) => {
                const fullDep = graph.dependencies.get(dep.absolutePath);
                return fullDep && (0, sideEffects_1.hasSideEffectWithDebugTrace)(options, graph, fullDep)[0];
            })
                .map((dep) => dep.data.name);
            // Add side-effects to the ignore list.
            const nonInlinedRequires = graph.transformOptions.nonInlinedRequires
                ? sideEffectReferences.concat(graph.transformOptions.nonInlinedRequires)
                : sideEffectReferences;
            ast = (0, metro_transform_worker_1.applyImportSupport)(ast, {
                filename: value.path,
                importAll,
                importDefault,
                options: {
                    // NOTE: This might not be needed...
                    ...graph.transformOptions,
                    nonInlinedRequires,
                    inlineRequires: true,
                    experimentalImportSupport: true,
                },
            });
            // TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
            let dependencyMapName = '';
            let dependencies;
            // This pass converts the modules to use the generated import names.
            try {
                // console.log(require('@babel/generator').default(ast).code);
                // Rewrite the deps to use Metro runtime, collect the new dep positions.
                // TODO: We could just update the deps in the graph to use the correct positions after we modify the AST. This seems hard and fragile though.
                ({ ast, dependencies, dependencyMapName } = (0, collectDependencies_1.default)(ast, {
                    ...reconcile.collectDependenciesOptions,
                    // This is here for debugging purposes.
                    keepRequireNames: FORCE_REQUIRE_NAME_HINTS,
                    // This setting shouldn't be shared + it can't be serialized and cached anyways.
                    dependencyTransformer: undefined,
                }));
            }
            catch (error) {
                if (error instanceof collectDependencies_1.InvalidRequireCallError) {
                    throw new InvalidRequireCallError(error, value.path);
                }
                throw error;
            }
            // @ts-expect-error: Mutating the value in place.
            value.dependencies =
                //
                sortDependencies(dependencies, value.dependencies);
            const { ast: wrappedAst } = JsFileWrapping_1.default.wrapModule(ast, reconcile.importDefault, reconcile.importAll, dependencyMapName, reconcile.globalPrefix, 
            // @ts-expect-error: not on type yet...
            reconcile.unstable_renameRequire === false);
            const reserved = [];
            if (reconcile.unstable_dependencyMapReservedName != null) {
                reserved.push(reconcile.unstable_dependencyMapReservedName);
            }
            if (reconcile.normalizePseudoGlobals) {
                // This MUST run before `generate` as it mutates the ast out of place.
                reserved.push(...metro_transform_plugins_1.default.normalizePseudoGlobals(wrappedAst, {
                    reservedNames: reserved,
                }));
            }
            const result = (0, generator_1.default)(wrappedAst, {
                // comments: true,
                // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L137
                compact: reconcile.unstable_compactOutput,
                filename: value.path,
                retainLines: false,
                sourceFileName: value.path,
                sourceMaps: true,
            }, outputItem.data.code);
            let map = result.rawMappings ? result.rawMappings.map(metro_source_map_1.toSegmentTuple) : [];
            let code = result.code;
            if (reconcile.minify) {
                const source = value.getSource().toString('utf-8');
                ({ map, code } = await (0, metro_transform_worker_1.minifyCode)(reconcile.minify, config.projectRoot, value.path, result.code, source, map, reserved));
            }
            return {
                ...outputItem,
                data: {
                    ...outputItem.data,
                    code,
                    // @ts-expect-error: TODO: Source maps are likely completely broken.
                    map,
                    lineCount: (0, countLines_1.default)(code),
                    functionMap: 
                    // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
                    ast.metadata?.metro?.functionMap ??
                        // @ts-expect-error: Fallback to deprecated explicitly-generated `functionMap`
                        ast.functionMap ??
                        null,
                },
            };
        }
    };
}
exports.createReconcileTransformerPlugin = createReconcileTransformerPlugin;
// Some imports may change order during the transform, so we need to resort them.
// Resort the dependencies to match the current order of the AST.
function sortDependencies(dependencies, accordingTo) {
    // Some imports may change order during the transform, so we need to resort them.
    // Resort the dependencies to match the current order of the AST.
    const nextDependencies = new Map();
    // Metro uses this Map hack so we need to create a new map and add the items in the expected order/
    dependencies.forEach((dep) => {
        nextDependencies.set(dep.data.key, {
            ...(accordingTo.get(dep.data.key) || {}),
            // @ts-expect-error: Missing async types. This could be a problem for bundle splitting.
            data: dep,
        });
    });
    return nextDependencies;
}
//# sourceMappingURL=reconcileTransformSerializerPlugin.js.map