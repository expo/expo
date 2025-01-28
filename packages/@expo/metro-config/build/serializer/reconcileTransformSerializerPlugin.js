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
exports.reconcileTransformSerializerPlugin = exports.isEnvBoolean = exports.sortDependencies = void 0;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const generator_1 = __importDefault(require("@babel/generator"));
const assert_1 = __importDefault(require("assert"));
const JsFileWrapping_1 = __importDefault(require("metro/src/ModuleGraph/worker/JsFileWrapping"));
const metro_source_map_1 = require("metro-source-map");
const metro_transform_plugins_1 = __importDefault(require("metro-transform-plugins"));
const jsOutput_1 = require("./jsOutput");
const sideEffects_1 = require("./sideEffects");
const collect_dependencies_1 = __importStar(require("../transform-worker/collect-dependencies"));
const count_lines_1 = require("../transform-worker/count-lines");
const metro_transform_worker_1 = require("../transform-worker/metro-transform-worker");
const debug = require('debug')('expo:treeshaking');
const FORCE_REQUIRE_NAME_HINTS = false;
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
exports.sortDependencies = sortDependencies;
function isOptimizeEnabled(graph) {
    return isEnvBoolean(graph, 'optimize');
}
function isEnvBoolean(graph, name) {
    if (!graph.transformOptions.customTransformOptions)
        return false;
    return String(graph.transformOptions.customTransformOptions[name]) === 'true';
}
exports.isEnvBoolean = isEnvBoolean;
// This is the insane step which reconciles the second half of the transformation process but it does it uncached at the end of the bundling process when we have tree shaking completed.
async function reconcileTransformSerializerPlugin(entryPoint, preModules, graph, options) {
    if (!isOptimizeEnabled(graph)) {
        return [entryPoint, preModules, graph, options];
    }
    // Convert all remaining AST and dependencies to standard output that Metro expects.
    // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
    for (const value of graph.dependencies.values()) {
        for (const index in value.output) {
            const output = value.output[index];
            if ((0, jsOutput_1.isExpoJsOutput)(output)) {
                // @ts-expect-error: Typed as readonly
                value.output[index] =
                    //
                    await transformDependencyOutput(value, output);
            }
        }
    }
    return [entryPoint, preModules, graph, options];
    async function transformDependencyOutput(value, outputItem) {
        if (outputItem.type !== 'js/module' ||
            value.path.endsWith('.json') ||
            value.path.match(/\.(s?css|sass)$/)) {
            debug('Skipping post transform for non-js/module: ' + value.path);
            return outputItem;
        }
        // This should be cached by the transform worker for use here to ensure close to consistent
        // results between the tree-shake and the final transform.
        const reconcile = outputItem.data.reconcile;
        (0, assert_1.default)(reconcile, 'reconcile settings are required in the module graph for post transform.');
        let ast = outputItem.data.ast;
        (0, assert_1.default)(ast, 'Missing AST for module: ' + value.path);
        delete outputItem.data.ast;
        const { importDefault, importAll } = reconcile;
        const sideEffectReferences = () => [...value.dependencies.values()]
            .filter((dep) => {
            const fullDep = graph.dependencies.get(dep.absolutePath);
            return fullDep && (0, sideEffects_1.hasSideEffectWithDebugTrace)(options, graph, fullDep)[0];
        })
            .map((dep) => dep.data.name);
        ast = (0, metro_transform_worker_1.applyImportSupport)(ast, {
            filename: value.path,
            importAll,
            importDefault,
            options: {
                // NOTE: This might not be needed...
                ...graph.transformOptions,
                experimentalImportSupport: true,
                inlineRequires: reconcile.inlineRequires,
                // Add side-effects to the ignore list.
                nonInlinedRequires: reconcile.inlineRequires
                    ? graph.transformOptions.nonInlinedRequires
                        ? sideEffectReferences().concat(graph.transformOptions.nonInlinedRequires)
                        : sideEffectReferences()
                    : [],
            },
        });
        let dependencyMapName = '';
        let dependencies;
        // This pass converts the modules to use the generated import names.
        try {
            // Rewrite the deps to use Metro runtime, collect the new dep positions.
            ({ ast, dependencies, dependencyMapName } = (0, collect_dependencies_1.default)(ast, {
                ...reconcile.collectDependenciesOptions,
                collectOnly: false,
                // This is here for debugging purposes.
                keepRequireNames: FORCE_REQUIRE_NAME_HINTS,
                // This setting shouldn't be shared + it can't be serialized and cached anyways.
                dependencyTransformer: undefined,
            }));
        }
        catch (error) {
            if (error instanceof collect_dependencies_1.InvalidRequireCallError) {
                throw new metro_transform_worker_1.InvalidRequireCallError(error, value.path);
            }
            throw error;
        }
        // @ts-expect-error: Mutating the value in place.
        value.dependencies =
            //
            sortDependencies(dependencies, value.dependencies);
        const { ast: wrappedAst } = JsFileWrapping_1.default.wrapModule(ast, reconcile.importDefault, reconcile.importAll, dependencyMapName, reconcile.globalPrefix, reconcile.unstable_renameRequire === false);
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
        // @ts-expect-error: incorrectly typed upstream
        let map = result.rawMappings ? result.rawMappings.map(metro_source_map_1.toSegmentTuple) : [];
        let code = result.code;
        if (reconcile.minify) {
            const source = value.getSource().toString('utf-8');
            ({ map, code } = await (0, metro_transform_worker_1.minifyCode)(reconcile.minify, value.path, result.code, source, map, reserved));
        }
        let lineCount;
        ({ lineCount, map } = (0, count_lines_1.countLinesAndTerminateMap)(code, map));
        return {
            ...outputItem,
            data: {
                ...outputItem.data,
                code,
                map,
                lineCount,
                functionMap: 
                // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
                ast.metadata?.metro?.functionMap ??
                    // @ts-expect-error: Fallback to deprecated explicitly-generated `functionMap`
                    ast.functionMap ??
                    outputItem.data.functionMap ??
                    null,
            },
        };
    }
}
exports.reconcileTransformSerializerPlugin = reconcileTransformSerializerPlugin;
//# sourceMappingURL=reconcileTransformSerializerPlugin.js.map