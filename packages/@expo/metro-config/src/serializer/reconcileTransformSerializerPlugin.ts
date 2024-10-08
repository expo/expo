/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import generate from '@babel/generator';
import {
  MixedOutput,
  Module,
  ReadOnlyGraph,
  SerializerOptions,
} from '@bycedric/metro/metro/src/DeltaBundler/types.flow';
import JsFileWrapping from '@bycedric/metro/metro/src/ModuleGraph/worker/JsFileWrapping';
import type { SerializerConfigT } from '@bycedric/metro/metro-config';
import { toSegmentTuple } from '@bycedric/metro/metro-source-map';
import metroTransformPlugins from '@bycedric/metro/metro-transform-plugins';
import assert from 'assert';

import { ExpoJsOutput, isExpoJsOutput } from './jsOutput';
import { hasSideEffectWithDebugTrace } from './sideEffects';
import collectDependencies, {
  Dependency,
  InvalidRequireCallError as InternalInvalidRequireCallError,
} from '../transform-worker/collect-dependencies';
import { countLinesAndTerminateMap } from '../transform-worker/count-lines';
import {
  applyImportSupport,
  InvalidRequireCallError,
  minifyCode,
} from '../transform-worker/metro-transform-worker';

type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

type SerializerParameters = Parameters<Serializer>;

const debug = require('debug')('expo:treeshaking') as typeof console.log;

const FORCE_REQUIRE_NAME_HINTS = false;

// Some imports may change order during the transform, so we need to resort them.
// Resort the dependencies to match the current order of the AST.
export function sortDependencies(
  dependencies: readonly Dependency[],
  accordingTo: Module['dependencies']
): Map<string, Dependency> {
  // Some imports may change order during the transform, so we need to resort them.
  // Resort the dependencies to match the current order of the AST.
  const nextDependencies = new Map<string, Dependency>();

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

function isOptimizeEnabled(graph: ReadOnlyGraph) {
  return isEnvBoolean(graph, 'optimize');
}

export function isEnvBoolean(graph: ReadOnlyGraph, name: string): boolean {
  if (!graph.transformOptions.customTransformOptions) return false;
  return String(graph.transformOptions.customTransformOptions[name]) === 'true';
}

// This is the insane step which reconciles the second half of the transformation process but it does it uncached at the end of the bundling process when we have tree shaking completed.
export async function reconcileTransformSerializerPlugin(
  entryPoint: string,
  preModules: readonly Module<MixedOutput>[],
  graph: ReadOnlyGraph,
  options: SerializerOptions
): Promise<SerializerParameters> {
  if (!isOptimizeEnabled(graph)) {
    return [entryPoint, preModules, graph, options];
  }

  // Convert all remaining AST and dependencies to standard output that Metro expects.
  // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
  for (const value of graph.dependencies.values()) {
    for (const index in value.output) {
      const output = value.output[index];
      if (isExpoJsOutput(output)) {
        // @ts-expect-error: Typed as readonly
        value.output[index] =
          //
          await transformDependencyOutput(value, output);
      }
    }
  }

  return [entryPoint, preModules, graph, options];

  async function transformDependencyOutput(
    value: Module<MixedOutput>,
    outputItem: ExpoJsOutput
  ): Promise<ExpoJsOutput> {
    if (
      outputItem.type !== 'js/module' ||
      value.path.endsWith('.json') ||
      value.path.match(/\.(s?css|sass)$/)
    ) {
      debug('Skipping post transform for non-js/module: ' + value.path);
      return outputItem;
    }

    // This should be cached by the transform worker for use here to ensure close to consistent
    // results between the tree-shake and the final transform.
    const reconcile = outputItem.data.reconcile;

    assert(reconcile, 'reconcile settings are required in the module graph for post transform.');

    let ast = outputItem.data.ast;
    assert(ast, 'Missing AST for module: ' + value.path);
    delete outputItem.data.ast;

    const { importDefault, importAll } = reconcile;

    const sideEffectReferences = () =>
      [...value.dependencies.values()]
        .filter((dep) => {
          const fullDep = graph.dependencies.get(dep.absolutePath);
          return fullDep && hasSideEffectWithDebugTrace(options, graph, fullDep)[0];
        })
        .map((dep) => dep.data.name);

    ast = applyImportSupport(ast, {
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
    let dependencies: readonly Dependency[];

    // This pass converts the modules to use the generated import names.
    try {
      // Rewrite the deps to use Metro runtime, collect the new dep positions.
      ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
        ...reconcile.collectDependenciesOptions,
        collectOnly: false,
        // This is here for debugging purposes.
        keepRequireNames: FORCE_REQUIRE_NAME_HINTS,
        // This setting shouldn't be shared + it can't be serialized and cached anyways.
        dependencyTransformer: undefined,
      }));
    } catch (error) {
      if (error instanceof InternalInvalidRequireCallError) {
        throw new InvalidRequireCallError(error, value.path);
      }
      throw error;
    }

    // @ts-expect-error: Mutating the value in place.
    value.dependencies =
      //
      sortDependencies(dependencies, value.dependencies);

    const { ast: wrappedAst } = JsFileWrapping.wrapModule(
      ast,
      reconcile.importDefault,
      reconcile.importAll,
      dependencyMapName,
      reconcile.globalPrefix,
      reconcile.unstable_renameRequire === false
    );

    const reserved: string[] = [];
    if (reconcile.unstable_dependencyMapReservedName != null) {
      reserved.push(reconcile.unstable_dependencyMapReservedName);
    }
    if (reconcile.normalizePseudoGlobals) {
      // This MUST run before `generate` as it mutates the ast out of place.
      reserved.push(
        ...metroTransformPlugins.normalizePseudoGlobals(wrappedAst, {
          reservedNames: reserved,
        })
      );
    }

    const result = generate(
      wrappedAst,
      {
        // comments: true,
        // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L137
        compact: reconcile.unstable_compactOutput,
        filename: value.path,
        retainLines: false,
        sourceFileName: value.path,
        sourceMaps: true,
      },
      outputItem.data.code
    );

    // @ts-expect-error: incorrectly typed upstream
    let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
    let code = result.code;

    if (reconcile.minify) {
      const source = value.getSource().toString('utf-8');

      ({ map, code } = await minifyCode(
        reconcile.minify,
        value.path,
        result.code,
        source,
        map,
        reserved
      ));
    }

    let lineCount;
    ({ lineCount, map } = countLinesAndTerminateMap(code, map));

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
