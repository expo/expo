/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { transformFromAstSync } from '@babel/core';
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
import { accessAst, isShakingEnabled } from './treeShakeSerializerPlugin';
import {
  ReconcileTransformSettings,
  minifyCode,
  renameTopLevelModuleVariables,
} from '../transform-worker/metro-transform-worker';
import { hasSideEffectWithDebugTrace } from './sideEffectsSerializerPlugin';

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
export function createPostTreeShakeTransformSerializerPlugin(config: InputConfigT) {
  return async function treeShakeSerializer(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): Promise<SerializerParameters> {
    if (!isShakingEnabled(graph, options)) {
      return [entryPoint, preModules, graph, options];
    }

    const preserveEsm = false;

    // Convert all remaining AST and dependencies to standard output that Metro expects.
    // This is normally done in the transformer, but we skipped it so we could perform graph analysis (tree-shake).
    for (const value of graph.dependencies.values()) {
      for (const index in value.output) {
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
      const reconcile = outputItem.data.reconcile as ReconcileTransformSettings;

      // const collectDependenciesOptions = outputItem.data.collectDependenciesOptions;
      assertCollectDependenciesOptions(reconcile.collectDependenciesOptions);

      let ast = accessAst(outputItem);
      if (!ast) {
        throw new Error('missing AST for ' + value.path);
      }

      // @ts-expect-error: TODO
      delete outputItem.data.ast;

      const importDefault = reconcile.collectDependenciesOptions.inlineableCalls[0];
      const importAll = reconcile.collectDependenciesOptions.inlineableCalls[1];
      // const { importDefault, importAll } = generateImportNames(ast);

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

      const babelPluginOpts = {
        ...graph.transformOptions,

        inlineableCalls: [importDefault, importAll],
        importDefault,
        importAll,
        nonInlinedRequires,
      };

      // @ts-expect-error: TODO
      ast = transformFromAstSync(ast, undefined, {
        ast: true,
        babelrc: false,
        code: false,
        configFile: false,
        filename: value.path,
        plugins: [
          // functionMapBabelPlugin,
          renameTopLevelModuleVariables,
          [metroTransformPlugins.importExportPlugin, babelPluginOpts],

          // TODO: Add support for disabling safe inline requires.
          [metroTransformPlugins.inlineRequiresPlugin, babelPluginOpts],
        ].filter(Boolean),
        sourceMaps: false,
        // // Not-Cloning the input AST here should be safe because other code paths above this call
        // // are mutating the AST as well and no code is depending on the original AST.
        // // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
        // // either because one of the plugins is doing something funky or Babel messes up some caches.
        // // Make sure to test the above mentioned case before flipping the flag back to false.
        // cloneInputAst: true,
      })?.ast!;

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

      const results = JsFileWrapping.wrapModule(
        ast,
        importDefault,
        importAll,
        dependencyMapName,
        // TODO: Share these with transformer
        reconcile.globalPrefix,
        // @ts-expect-error
        reconcile.unstable_renameRequire === false
      );
      const wrappedAst = results.ast;

      const source = value.getSource().toString('utf-8');

      const reserved: string[] = [];
      if (reconcile.unstable_dependencyMapReservedName != null) {
        reserved.push(reconcile.unstable_dependencyMapReservedName);
      }
      // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L128C28-L128C38
      const optimizationSizeLimit = reconcile.optimizationSizeLimit ?? 150 * 1024;
      if (
        reconcile.minify &&
        source.length <= optimizationSizeLimit &&
        !reconcile.unstable_disableNormalizePseudoGlobals
      ) {
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

      let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
      let code = result.code;

      if (reconcile.minify && !preserveEsm) {
        ({ map, code } = await minifyCode(
          { minifierPath: reconcile.minifierPath, minifierConfig: reconcile.minifierConfig },
          config.projectRoot!,
          value.path,
          result.code,
          source,
          map,
          reserved
        ));
      }

      // console.log(code);
      // console.log(require('@babel/generator').default(ast).code);

      return {
        ...outputItem,
        data: {
          ...outputItem.data,
          code,
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
  };
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
      data: dep,
    });
  });

  return nextDependencies;
}

// TODO: The dep sorting seems to break on this module when it isn't sorted.
// https://github.com/software-mansion/react-native-gesture-handler/blob/main/src/handlers/gestureHandlerCommon.ts
// https://github.com/software-mansion/react-native-gesture-handler/blob/e95f85345dd9e9a4d4ff67fbaa0a0a2abbe3bccb/src/handlers/gestureHandlerCommon.ts#L281C5-L281C21
