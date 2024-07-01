/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import generate from '@babel/generator';
import assert from 'assert';
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import JsFileWrapping from 'metro/src/ModuleGraph/worker/JsFileWrapping';
import collectDependencies, {
  InvalidRequireCallError as InternalInvalidRequireCallError,
  type Dependency,
  Options as CollectDependenciesOptions,
} from 'metro/src/ModuleGraph/worker/collectDependencies';
import countLines from 'metro/src/lib/countLines';
import { InputConfigT, SerializerConfigT } from 'metro-config';
import { toSegmentTuple } from 'metro-source-map';
import metroTransformPlugins from 'metro-transform-plugins';

import { hasSideEffectWithDebugTrace } from './sideEffects';
import { accessAst, isShakingEnabled } from './treeShakeSerializerPlugin';
import {
  ReconcileTransformSettings,
  applyImportSupport,
  minifyCode,
} from '../transform-worker/metro-transform-worker';

type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

type SerializerParameters = Parameters<Serializer>;

const debug = require('debug')('expo:treeshaking') as typeof console.log;

const FORCE_REQUIRE_NAME_HINTS = false;

class InvalidRequireCallError extends Error {
  innerError: InternalInvalidRequireCallError;
  filename: string;

  constructor(innerError: InternalInvalidRequireCallError, filename: string) {
    super(`${filename}:${innerError.message}`);
    this.innerError = innerError;
    this.filename = filename;
  }
}

function assertCollectDependenciesOptions(
  collectDependenciesOptions: any
): asserts collectDependenciesOptions is CollectDependenciesOptions {
  if (!collectDependenciesOptions) {
    throw new Error(
      'collectDependenciesOptions is required. Something is wrong with the metro transformer or transform cache.'
    );
  }
  if (typeof collectDependenciesOptions !== 'object') {
    throw new Error('collectDependenciesOptions must be an object.');
  }
  assert('inlineableCalls' in collectDependenciesOptions, 'inlineableCalls is required.');
}

// This is the insane step which reconciles the second half of the transformation process but it does it uncached at the end of the bundling process when we have tree shaking completed.
export async function reconcileTransformSerializerPlugin(
  entryPoint: string,
  preModules: readonly Module<MixedOutput>[],
  graph: ReadOnlyGraph,
  options: SerializerOptions
): Promise<SerializerParameters> {
  if (!isShakingEnabled(graph, options)) {
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

  async function transformDependencyOutput(
    value: Module<MixedOutput>,
    outputItem: MixedOutput
  ): Promise<MixedOutput> {
    if (outputItem.type !== 'js/module' || value.path.endsWith('.json')) {
      debug('Skipping post transform for non-js/module: ' + value.path);
      return outputItem;
    }

    // This should be cached by the transform worker for use here to ensure close to consistent
    // results between the tree-shake and the final transform.
    // @ts-expect-error: reconcile object is not on the type.
    const reconcile = outputItem.data.reconcile as ReconcileTransformSettings;

    assert(reconcile, 'reconcile settings are required in the module graph for post transform.');

    assertCollectDependenciesOptions(reconcile.collectDependenciesOptions);

    let ast = accessAst(outputItem);
    if (!ast) {
      throw new Error('missing AST for ' + value.path);
    }

    // @ts-expect-error: TODO
    delete outputItem.data.ast;

    const { importDefault, importAll } = reconcile;

    const sideEffectReferences = [...value.dependencies.values()]
      .filter((dep) => {
        const fullDep = graph.dependencies.get(dep.absolutePath);
        return fullDep && hasSideEffectWithDebugTrace(options, graph, fullDep)[0];
      })
      .map((dep) => dep.data.name);

    // Add side-effects to the ignore list.
    const nonInlinedRequires = graph.transformOptions.nonInlinedRequires
      ? sideEffectReferences.concat(graph.transformOptions.nonInlinedRequires)
      : sideEffectReferences;

    ast = applyImportSupport(ast, {
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
    let dependencies: readonly Dependency[];

    // This pass converts the modules to use the generated import names.
    try {
      // console.log(require('@babel/generator').default(ast).code);

      // Rewrite the deps to use Metro runtime, collect the new dep positions.
      // TODO: We could just update the deps in the graph to use the correct positions after we modify the AST. This seems hard and fragile though.
      ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
        ...reconcile.collectDependenciesOptions,
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
      // @ts-expect-error: not on type yet...
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

    // @ts-expect-error: TODO: Source maps are likely completely broken.
    let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
    let code = result.code;

    console.log(graph.transformOptions, options);
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

    return {
      ...outputItem,
      data: {
        ...outputItem.data,
        code,
        // @ts-expect-error: TODO: Source maps are likely completely broken.
        map,
        lineCount: countLines(code),
        functionMap:
          // @ts-expect-error: https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-transform-worker/src/index.js#L508-L512
          ast.metadata?.metro?.functionMap ??
          // @ts-expect-error: Fallback to deprecated explicitly-generated `functionMap`
          ast.functionMap ??
          null,
      },
    };
  }
}

// Some imports may change order during the transform, so we need to resort them.
// Resort the dependencies to match the current order of the AST.
function sortDependencies(
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
