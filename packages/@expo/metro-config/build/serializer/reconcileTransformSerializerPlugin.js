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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortDependencies = sortDependencies;
exports.isEnvBoolean = isEnvBoolean;
exports.reconcileTransformSerializerPlugin = reconcileTransformSerializerPlugin;
const generator_1 = __importDefault(require("@babel/generator"));
const JsFileWrapping = __importStar(require("@expo/metro/metro/ModuleGraph/worker/JsFileWrapping"));
const importLocationsPlugin_1 = require("@expo/metro/metro/ModuleGraph/worker/importLocationsPlugin");
const isResolvedDependency_1 = require("@expo/metro/metro/lib/isResolvedDependency");
const metro_source_map_1 = require("@expo/metro/metro-source-map");
const metro_transform_plugins_1 = require("@expo/metro/metro-transform-plugins");
const assert_1 = __importDefault(require("assert"));
const node_util_1 = __importDefault(require("node:util"));
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
    const findDependency = (dep) => {
        const original = accordingTo.get(dep.data.key);
        // We can do a quick check first but this may not always work.
        //
        // In cases where the original import was ESM but mutated during tree-shaking (such as `export * from "./"`) then the
        // key will always be based on CJS because we need to transform before collecting a second time.
        //
        // In this case, we'll create the inverse key based on ESM to try and find the original dependency.
        if (original) {
            return original;
        }
        // Only perform the hacky inverse key check if it's this specific case that we know about, otherwise throw an error.
        if (dep.data.isESMImport === false) {
            const inverseKey = (0, collect_dependencies_1.hashKey)((0, collect_dependencies_1.getKeyForDependency)({
                asyncType: dep.data.asyncType,
                isESMImport: !dep.data.isESMImport,
                name: dep.name,
                contextParams: dep.data.contextParams,
            }));
            if (accordingTo.has(inverseKey)) {
                return accordingTo.get(inverseKey);
            }
        }
        // If the dependency was optional, then we can skip throwing the error.
        if (dep.data.isOptional) {
            return null;
        }
        debug('failed to finding matching dependency', node_util_1.default.inspect(dep, { colors: true, depth: 6 }), node_util_1.default.inspect(accordingTo, { colors: true, depth: 6 }));
        throw new Error(`Dependency ${dep.data.key} (${dep.name}) not found in the original module during optimization pass. Available keys: ${Array.from(accordingTo.entries())
            .map(([key, dep]) => `${key} (${dep.data.name})`)
            .join(', ')}`);
    };
    // Metro uses this Map hack so we need to create a new map and add the items in the expected order/
    dependencies.forEach((dep) => {
        const original = findDependency(dep);
        // In the case of missing optional dependencies, the absolutePath will not be defined.
        if (!original) {
            nextDependencies.set(dep.data.key, {
                // @ts-expect-error: Missing async types. This could be a problem for bundle splitting.
                data: dep,
            });
        }
        nextDependencies.set(dep.data.key, {
            ...original,
            // @ts-expect-error: Missing async types. This could be a problem for bundle splitting.
            data: dep,
        });
    });
    return nextDependencies;
}
function isOptimizeEnabled(graph) {
    return isEnvBoolean(graph, 'optimize');
}
function isEnvBoolean(graph, name) {
    if (!graph.transformOptions.customTransformOptions)
        return false;
    return String(graph.transformOptions.customTransformOptions[name]) === 'true';
}
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
            const fullDep = (0, isResolvedDependency_1.isResolvedDependency)(dep)
                ? graph.dependencies.get(dep.absolutePath)
                : undefined;
            return fullDep && (0, sideEffects_1.hasSideEffectWithDebugTrace)(options, graph, fullDep)[0];
        })
            .map((dep) => dep.data.name);
        const file = (0, metro_transform_worker_1.applyImportSupport)(ast, {
            collectLocations: true,
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
        ast = file.ast;
        let dependencyMapName = '';
        let dependencies;
        const importDeclarationLocs = file.metadata?.metro?.unstable_importDeclarationLocs ?? null;
        // This pass converts the modules to use the generated import names.
        try {
            // Rewrite the deps to use Metro runtime, collect the new dep positions.
            ({ ast, dependencies, dependencyMapName } = (0, collect_dependencies_1.default)(ast, {
                ...reconcile.collectDependenciesOptions,
                unstable_isESMImportAtSource: importDeclarationLocs != null
                    ? (loc) => {
                        return importDeclarationLocs.has((0, importLocationsPlugin_1.locToKey)(loc));
                    }
                    : null,
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
        const { ast: wrappedAst } = JsFileWrapping.wrapModule(ast, reconcile.importDefault, reconcile.importAll, dependencyMapName, reconcile.globalPrefix, reconcile.unstable_renameRequire === false);
        const reserved = [];
        if (reconcile.unstable_dependencyMapReservedName != null) {
            reserved.push(reconcile.unstable_dependencyMapReservedName);
        }
        if (reconcile.normalizePseudoGlobals) {
            // This MUST run before `generate` as it mutates the ast out of place.
            reserved.push(...(0, metro_transform_plugins_1.normalizePseudoGlobals)(wrappedAst, {
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
//# sourceMappingURL=reconcileTransformSerializerPlugin.js.map