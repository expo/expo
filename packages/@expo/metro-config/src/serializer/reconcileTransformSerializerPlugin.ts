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
  minifyCode,
  renameTopLevelModuleVariables,
} from '../transform-worker/metro-transform-worker';
import { hasSideEffectWithDebugTrace } from './sideEffectsSerializerPlugin';

type Serializer = NonNullable<SerializerConfigT['customSerializer']>;

type SerializerParameters = Parameters<Serializer>;

const debug = require('debug')('expo:treeshaking') as typeof console.log;

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
        transformDependencyOutput(value, value.output[index]);
      }
    }

    return [entryPoint, preModules, graph, options];

    async function transformDependencyOutput(
      value: Module<MixedOutput>,
      outputItem: MixedOutput
    ): Promise<Module<MixedOutput>> {
      if (outputItem.type !== 'js/module' || value.path.endsWith('.json')) {
        debug('Skipping post transform for non-js/module: ' + value.path);
        return value;
      }

      // This should be cached by the transform worker for use here to ensure close to consistent
      // results between the tree-shake and the final transform.
      const {
        collectDependenciesOptions,
        globalPrefix,
        unstable_compactOutput,
        minify,
        minifierPath,
        minifierConfig,
        unstable_renameRequire,

        ...reconcile
        // @ts-expect-error: TODO
      } = outputItem.data.reconcile;

      // const collectDependenciesOptions = outputItem.data.collectDependenciesOptions;
      assertCollectDependenciesOptions(collectDependenciesOptions);

      let ast = accessAst(outputItem);
      if (!ast) {
        return value;
      }

      // @ts-expect-error: TODO
      delete outputItem.data.ast;

      const importDefault = collectDependenciesOptions.inlineableCalls[0];
      const importAll = collectDependenciesOptions.inlineableCalls[1];
      // const { importDefault, importAll } = generateImportNames(ast);

      const sideEffectReferences = [...value.dependencies.values()]
        .filter((dep) => {
          const fullDep = graph.dependencies.get(dep.absolutePath);
          return fullDep && hasSideEffectWithDebugTrace(options, graph, fullDep)[0];
        })
        .map((dep) => dep.data.name);

      const babelPluginOpts = {
        ...graph.transformOptions,

        inlineableCalls: [importDefault, importAll],
        importDefault,
        importAll,

        // Add side-effects to the ignore list.
        nonInlinedRequires: graph.transformOptions.nonInlinedRequires
          ? sideEffectReferences.concat(graph.transformOptions.nonInlinedRequires)
          : sideEffectReferences,
      };

      // @ts-expect-error: TODO
      ast = transformFromAstSync(ast, undefined, {
        ast: true,
        babelrc: false,
        code: false,
        configFile: false,
        // comments: includeDebugInfo,
        // compact: false,
        filename: value.path,
        plugins: [
          // functionMapBabelPlugin,
          renameTopLevelModuleVariables,
          !preserveEsm && [metroTransformPlugins.importExportPlugin, babelPluginOpts],

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
        const opts = collectDependenciesOptions;

        // TODO: We should try to drop this black-box approach since we don't need the deps.
        // We just need the AST modifications such as `require.context`.

        // console.log(require('@babel/generator').default(ast).code);

        ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
          ...opts,
          // This setting shouldn't be shared + it can't be serialized and cached anyways.
          dependencyTransformer: null,
        }));
      } catch (error) {
        if (error instanceof InternalInvalidRequireCallError) {
          throw new InvalidRequireCallError(error, value.path);
        }
        throw error;
      }

      // Some imports may change order during the transform, so we need to resort them.
      // Resort the dependencies to match the current order of the AST.
      const nextDependencies = new Map<string, Dependency>();

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
      // const globalPrefix = config.transformer?.globalPrefix ?? '';

      let wrappedAst;
      try {
        const results = JsFileWrapping.wrapModule(
          ast,
          importDefault,
          importAll,
          dependencyMapName,
          // TODO: Share these with transformer
          globalPrefix,
          // @ts-expect-error
          unstable_renameRequire === false
        );
        wrappedAst = results.ast;
      } catch (error) {
        // This can throw if there's a top-level declaration of a variable named "module".
        // If the error is a SyntaxError then parse and throw a proper babel error.
        // console.log('Error wrapping module:', value.path);
        // console.log(generate(ast).code);
        throw error;
      }

      const source = value.getSource().toString('utf-8');

      const reserved: string[] = [];
      if (reconcile.unstable_dependencyMapReservedName != null) {
        reserved.push(reconcile.unstable_dependencyMapReservedName);
      }
      // https://github.com/facebook/metro/blob/6151e7eb241b15f3bb13b6302abeafc39d2ca3ad/packages/metro-config/src/defaults/index.js#L128C28-L128C38
      const optimizationSizeLimit = reconcile.optimizationSizeLimit ?? 150 * 1024;
      if (
        minify &&
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
          compact: unstable_compactOutput,
          filename: value.path,
          retainLines: false,
          sourceFileName: value.path,
          sourceMaps: true,
        },
        outputItem.data.code
      );

      let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
      let code = result.code;

      if (minify && !preserveEsm) {
        ({ map, code } = await minifyCode(
          { minifierPath, minifierConfig },
          config.projectRoot!,
          value.path,
          result.code,
          source,
          map,
          reserved
        ));
        // console.log('module', code);
      }

      outputItem.data = {
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
      };

      return value;
    }
  };
}
