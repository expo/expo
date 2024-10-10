/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with additional transforms moved to `babel-preset-expo` and modifications made for web support.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/index.js#L1
 */
import { transformFromAstSync } from '@babel/core';
import type { PluginItem } from '@babel/core';
import generate from '@babel/generator';
import * as babylon from '@babel/parser';
import template from '@babel/template';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { BabelPresetExpoMetadata } from 'babel-preset-expo';
import JsFileWrapping from 'metro/src/ModuleGraph/worker/JsFileWrapping';
import generateImportNames from 'metro/src/ModuleGraph/worker/generateImportNames';
import type { BabelTransformer, BabelTransformerArgs } from 'metro-babel-transformer';
import { stableHash } from 'metro-cache';
import getMetroCacheKey from 'metro-cache-key';
import {
  fromRawMappings,
  functionMapBabelPlugin,
  toBabelSegments,
  toSegmentTuple,
} from 'metro-source-map';
import type { MetroSourceMapSegmentTuple } from 'metro-source-map';
import metroTransformPlugins from 'metro-transform-plugins';
import type {
  AssetFile,
  JSFile,
  JSFileType,
  JSONFile,
  JsTransformerConfig,
  JsTransformOptions,
  TransformationContext,
  TransformResponse,
} from 'metro-transform-worker';
import getMinifier from 'metro-transform-worker/src/utils/getMinifier';
import assert from 'node:assert';

import * as assetTransformer from './asset-transformer';
import collectDependencies, {
  InvalidRequireCallError as InternalInvalidRequireCallError,
  Dependency,
  DependencyTransformer,
  DynamicRequiresBehavior,
  Options as CollectDependenciesOptions,
  State,
} from './collect-dependencies';
import { countLinesAndTerminateMap } from './count-lines';
import { shouldMinify } from './resolveOptions';
import { ExpoJsOutput, ReconcileTransformSettings } from '../serializer/jsOutput';

export { JsTransformOptions };

export interface ExpoJSFile extends JSFile {
  readonly reactClientReference?: string;
  readonly expoDomComponentReference?: string;
  readonly hasCjsExports?: boolean;
}

export interface ExpoTransformResponse extends TransformResponse {
  readonly output: readonly ExpoJsOutput[];
}

export class InvalidRequireCallError extends Error {
  innerError: InternalInvalidRequireCallError;
  filename: string;

  constructor(innerError: InternalInvalidRequireCallError, filename: string) {
    super(`${filename}:${innerError.message}`);
    this.innerError = innerError;
    this.filename = filename;
  }
}

// asserts non-null
function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  assert(x != null, message);
  return x;
}

function getDynamicDepsBehavior(
  inPackages: DynamicRequiresBehavior,
  filename: string
): DynamicRequiresBehavior {
  switch (inPackages) {
    case 'reject':
      return 'reject';
    case 'throwAtRuntime':
      return /(?:^|[/\\])node_modules[/\\]/.test(filename) ? inPackages : 'reject';
    default:
      throw new Error(`invalid value for dynamic deps behavior: \`${inPackages}\``);
  }
}

export const minifyCode = async (
  config: Pick<JsTransformerConfig, 'minifierPath' | 'minifierConfig'>,
  filename: string,
  code: string,
  source: string,
  map: MetroSourceMapSegmentTuple[],
  reserved: string[] = []
): Promise<{
  code: string;
  map: MetroSourceMapSegmentTuple[];
}> => {
  const sourceMap = fromRawMappings([
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

  const minify = getMinifier(config.minifierPath);

  try {
    const minified = await minify({
      code,
      map: sourceMap,
      filename,
      reserved,
      config: config.minifierConfig,
    });

    return {
      code: minified.code,
      map: minified.map ? toBabelSegments(minified.map).map(toSegmentTuple) : [],
    };
  } catch (error: any) {
    if (error.constructor.name === 'JS_Parse_Error') {
      throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
    }

    throw error;
  }
};

function renameTopLevelModuleVariables() {
  // A babel plugin which renames variables in the top-level scope that are named "module".
  return {
    visitor: {
      Program(path: any) {
        ['global', 'require', 'module', 'exports'].forEach((name) => {
          path.scope.rename(name, path.scope.generateUidIdentifier(name).name);
        });
      },
    },
  };
}

function applyUseStrictDirective(ast: t.File | babylon.ParseResult<t.File>) {
  // Add "use strict" if the file was parsed as a module, and the directive did
  // not exist yet.
  const { directives } = ast.program;

  if (
    ast.program.sourceType === 'module' &&
    directives != null &&
    directives.findIndex((d) => d.value.value === 'use strict') === -1
  ) {
    directives.push(t.directive(t.directiveLiteral('use strict')));
  }
}

export function applyImportSupport<TFile extends t.File>(
  ast: TFile,
  {
    filename,
    options,
    importDefault,
    importAll,
  }: {
    filename: string;

    options: Pick<
      JsTransformOptions,
      'experimentalImportSupport' | 'inlineRequires' | 'nonInlinedRequires'
    >;
    importDefault: string;
    importAll: string;
  }
): TFile {
  // Perform the import-export transform (in case it's still needed), then
  // fold requires and perform constant folding (if in dev).
  const plugins: PluginItem[] = [];
  const babelPluginOpts = {
    ...options,
    inlineableCalls: [importDefault, importAll],
    importDefault,
    importAll,
  };

  // NOTE(EvanBacon): This is effectively a replacement for the `@babel/plugin-transform-modules-commonjs`
  // plugin that's running in `@react-native/babel-preset`, but with shared names for inlining requires.
  if (options.experimentalImportSupport === true) {
    plugins.push(
      // Ensure the iife "globals" don't have conflicting variables in the module.
      renameTopLevelModuleVariables,
      //
      [metroTransformPlugins.importExportPlugin, babelPluginOpts]
    );
  }

  // NOTE(EvanBacon): This can basically never be safely enabled because it doesn't respect side-effects and
  // has no ability to respect side-effects because the transformer hasn't collected all dependencies yet.
  if (options.inlineRequires) {
    plugins.push([
      metroTransformPlugins.inlineRequiresPlugin,
      {
        ...babelPluginOpts,
        ignoredRequires: options.nonInlinedRequires,
      },
    ]);
  }

  // NOTE(EvanBacon): We apply this conditionally in `babel-preset-expo` with other AST transforms.
  // plugins.push([metroTransformPlugins.inlinePlugin, babelPluginOpts]);

  // TODO: This MUST be run even though no plugins are added, otherwise the babel runtime generators are broken.
  if (plugins.length) {
    ast = nullthrows<TFile>(
      // @ts-expect-error
      transformFromAstSync(ast, '', {
        ast: true,
        babelrc: false,
        code: false,
        configFile: false,
        comments: true,
        filename,
        plugins,
        sourceMaps: false,

        // NOTE(kitten): This was done to wipe the paths/scope caches, which the `constantFoldingPlugin` needs to work,
        // but has been replaced with `programPath.scope.crawl()`.
        // Old Note from Metro:
        // > Not-Cloning the input AST here should be safe because other code paths above this call
        // > are mutating the AST as well and no code is depending on the original AST.
        // > However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
        // > either because one of the plugins is doing something funky or Babel messes up some caches.
        // > Make sure to test the above mentioned case before flipping the flag back to false.
        cloneInputAst: false,
      })?.ast
    );
  }
  return ast;
}

function performConstantFolding(
  ast: t.File | babylon.ParseResult<t.File>,
  { filename }: { filename: string }
) {
  // NOTE(kitten): Any Babel helpers that have been added (`path.hub.addHelper(...)`) will usually not have any
  // references, and hence the `constantFoldingPlugin` below will remove them.
  // To fix the references we add an explicit `programPath.scope.crawl()`. Alternatively, we could also wipe the
  // Babel traversal cache (`traverse.cache.clear()`)
  const clearProgramScopePlugin: PluginItem = {
    visitor: {
      Program: {
        enter(path) {
          path.scope.crawl();
        },
      },
    },
  };

  // Run the constant folding plugin in its own pass, avoiding race conditions
  // with other plugins that have exit() visitors on Program (e.g. the ESM
  // transform).
  ast = nullthrows<babylon.ParseResult<t.File>>(
    // @ts-expect-error
    transformFromAstSync(ast, '', {
      ast: true,
      babelrc: false,
      code: false,
      configFile: false,
      comments: true,
      filename,
      plugins: [clearProgramScopePlugin, metroTransformPlugins.constantFoldingPlugin],
      sourceMaps: false,

      // NOTE(kitten): In Metro, this is also false, but only works because the prior run of `transformFromAstSync` was always
      // running with `cloneInputAst: true`.
      // This isn't needed anymore since `clearProgramScopePlugin` re-crawls the AST’s scope instead.
      cloneInputAst: false,
    }).ast
  );
  return ast;
}

async function transformJS(
  file: ExpoJSFile,
  { config, options }: TransformationContext
): Promise<ExpoTransformResponse> {
  const targetEnv = options.customTransformOptions?.environment;
  const isServerEnv = targetEnv === 'node' || targetEnv === 'react-server';

  const optimize =
    // Ensure we don't enable tree shaking for scripts or assets.
    file.type === 'js/module' &&
    String(options.customTransformOptions?.optimize) === 'true' &&
    // Disable tree shaking on JSON files.
    !file.filename.match(/\.(json|s?css|sass)$/);

  const unstable_disableModuleWrapping = optimize || config.unstable_disableModuleWrapping;

  if (optimize && !options.experimentalImportSupport) {
    // Add a warning so devs can incrementally migrate since experimentalImportSupport may cause other issues in their app.
    throw new Error(
      'Experimental graph optimizations only work with experimentalImportSupport enabled.'
    );
  }

  // Transformers can output null ASTs (if they ignore the file). In that case
  // we need to parse the module source code to get their AST.
  let ast: t.File | babylon.ParseResult<t.File> =
    file.ast ?? babylon.parse(file.code, { sourceType: 'unambiguous' });

  // NOTE(EvanBacon): This can be really expensive on larger files. We should replace it with a cheaper alternative that just iterates and matches.
  const { importDefault, importAll } = generateImportNames(ast);

  // Add "use strict" if the file was parsed as a module, and the directive did
  // not exist yet.
  applyUseStrictDirective(ast);

  const unstable_renameRequire = config.unstable_renameRequire;

  // Disable all Metro single-file optimizations when full-graph optimization will be used.
  if (!optimize) {
    ast = applyImportSupport(ast, { filename: file.filename, options, importDefault, importAll });
  }

  if (!options.dev) {
    ast = performConstantFolding(ast, { filename: file.filename });
  }

  let dependencyMapName: string = '';
  let dependencies: readonly Dependency[];
  let wrappedAst: t.File | undefined;

  // If the module to transform is a script (meaning that is not part of the
  // dependency graph and it code will just be prepended to the bundle modules),
  // we need to wrap it differently than a commonJS module (also, scripts do
  // not have dependencies).
  let collectDependenciesOptions: CollectDependenciesOptions | undefined;
  if (file.type === 'js/script') {
    dependencies = [];
    wrappedAst = JsFileWrapping.wrapPolyfill(ast);
  } else {
    try {
      collectDependenciesOptions = {
        asyncRequireModulePath: config.asyncRequireModulePath,
        dependencyTransformer:
          config.unstable_disableModuleWrapping === true
            ? disabledDependencyTransformer
            : undefined,
        dynamicRequires: isServerEnv
          ? // NOTE(EvanBacon): Allow arbitrary imports in server environments.
            // This requires a patch to Metro collectDeps.
            'warn'
          : getDynamicDepsBehavior(config.dynamicDepsInPackages, file.filename),
        inlineableCalls: [importDefault, importAll],
        keepRequireNames: options.dev,
        allowOptionalDependencies: config.allowOptionalDependencies,
        dependencyMapName: config.unstable_dependencyMapReservedName,
        unstable_allowRequireContext: config.unstable_allowRequireContext,
        // If tree shaking is enabled, then preserve the original require calls.
        // This ensures require.context calls are not broken.
        collectOnly: optimize === true,
      };

      ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, {
        ...collectDependenciesOptions,
        // This setting shouldn't be shared with the tree shaking transformer.
        dependencyTransformer:
          unstable_disableModuleWrapping === true ? disabledDependencyTransformer : undefined,
      }));

      // Ensure we use the same name for the second pass of the dependency collection in the serializer.
      collectDependenciesOptions = {
        ...collectDependenciesOptions,
        dependencyMapName,
      };
    } catch (error) {
      if (error instanceof InternalInvalidRequireCallError) {
        throw new InvalidRequireCallError(error, file.filename);
      }
      throw error;
    }

    if (unstable_disableModuleWrapping === true) {
      wrappedAst = ast;
    } else {
      // TODO: Replace this with a cheaper transform that doesn't require AST.
      ({ ast: wrappedAst } = JsFileWrapping.wrapModule(
        ast,
        importDefault,
        importAll,
        dependencyMapName,
        config.globalPrefix,
        // TODO: This config is optional to allow its introduction in a minor
        // release. It should be made non-optional in ConfigT or removed in
        // future.
        unstable_renameRequire === false
      ));
    }
  }
  const minify = shouldMinify(options);

  const shouldNormalizePseudoGlobals =
    minify &&
    file.inputFileSize <= config.optimizationSizeLimit &&
    !config.unstable_disableNormalizePseudoGlobals;

  const reserved: string[] = [];
  if (config.unstable_dependencyMapReservedName != null) {
    reserved.push(config.unstable_dependencyMapReservedName);
  }

  if (
    shouldNormalizePseudoGlobals &&
    // TODO: If the module wrapping is disabled then the normalize function needs to change to account for not being in a body.
    !unstable_disableModuleWrapping
  ) {
    // NOTE(EvanBacon): Simply pushing this function will mutate the AST, so it must run before the `generate` step!!
    reserved.push(
      ...metroTransformPlugins.normalizePseudoGlobals(wrappedAst, {
        reservedNames: reserved,
      })
    );
  }

  const result = generate(
    wrappedAst,
    {
      comments: true,
      compact: config.unstable_compactOutput,
      filename: file.filename,
      retainLines: false,
      sourceFileName: file.filename,
      sourceMaps: true,
    },
    file.code
  );

  // @ts-expect-error: incorrectly typed upstream
  let map = result.rawMappings ? result.rawMappings.map(toSegmentTuple) : [];
  let code = result.code;

  // NOTE: We might want to enable this on native + hermes when tree shaking is enabled.
  if (minify) {
    ({ map, code } = await minifyCode(
      config,
      file.filename,
      result.code,
      file.code,
      map,
      reserved
    ));
  }

  const possibleReconcile: ReconcileTransformSettings | undefined =
    optimize && collectDependenciesOptions
      ? {
          inlineRequires: options.inlineRequires,
          importDefault,
          importAll,
          normalizePseudoGlobals: shouldNormalizePseudoGlobals,
          globalPrefix: config.globalPrefix,
          unstable_compactOutput: config.unstable_compactOutput,
          collectDependenciesOptions,
          minify: minify
            ? {
                minifierPath: config.minifierPath,
                minifierConfig: config.minifierConfig,
              }
            : undefined,
          unstable_dependencyMapReservedName:
            config.unstable_dependencyMapReservedName ?? undefined,
          optimizationSizeLimit: config.optimizationSizeLimit,
          unstable_disableNormalizePseudoGlobals: config.unstable_disableNormalizePseudoGlobals,
          unstable_renameRequire,
        }
      : undefined;

  let lineCount;
  ({ lineCount, map } = countLinesAndTerminateMap(code, map));

  const output: ExpoJsOutput[] = [
    {
      data: {
        code,
        lineCount,
        map,
        functionMap: file.functionMap ?? null,
        hasCjsExports: file.hasCjsExports,
        reactClientReference: file.reactClientReference,
        expoDomComponentReference: file.expoDomComponentReference,
        ...(possibleReconcile
          ? {
              ast: wrappedAst,
              // Store settings for the module that will be used to finish transformation after graph-based optimizations
              // have finished.
              reconcile: possibleReconcile,
            }
          : {}),
      },
      type: file.type,
    },
  ];

  return {
    dependencies,
    output,
  };
}

/** Transforms an asset file. */
async function transformAsset(
  file: AssetFile,
  context: TransformationContext
): Promise<ExpoTransformResponse> {
  const { assetRegistryPath, assetPlugins } = context.config;

  // TODO: Add web asset hashing in production.
  const result = await assetTransformer.transform(
    getBabelTransformArgs(file, context),
    assetRegistryPath,
    assetPlugins
  );

  const jsFile: ExpoJSFile = {
    ...file,
    type: 'js/module/asset',
    ast: result.ast,
    functionMap: null,
    hasCjsExports: true,
    reactClientReference: result.reactClientReference,
  };

  return transformJS(jsFile, context);
}

/**
 * Transforms a JavaScript file with Babel before processing the file with
 * the generic JavaScript transformation.
 */
async function transformJSWithBabel(
  file: ExpoJSFile,
  context: TransformationContext
): Promise<ExpoTransformResponse> {
  const { babelTransformerPath } = context.config;
  const transformer: BabelTransformer = require(babelTransformerPath);

  // HACK: React Compiler injects import statements and exits the Babel process which leaves the code in
  // a malformed state. For now, we'll enable the experimental import support which compiles import statements
  // outside of the standard Babel process.
  if (!context.options.experimentalImportSupport) {
    const reactCompilerFlag = context.options.customTransformOptions?.reactCompiler;
    if (reactCompilerFlag === true || reactCompilerFlag === 'true') {
      // @ts-expect-error: readonly.
      context.options.experimentalImportSupport = true;
    }
  }

  // TODO: Add a babel plugin which returns if the module has commonjs, and if so, disable all tree shaking optimizations early.
  const transformResult = await transformer.transform(
    // functionMapBabelPlugin populates metadata.metro.functionMap
    getBabelTransformArgs(file, context, [functionMapBabelPlugin])
  );

  const resultMetadata = transformResult.metadata as undefined | BabelPresetExpoMetadata;

  const jsFile: ExpoJSFile = {
    ...file,
    ast: transformResult.ast,
    functionMap:
      transformResult.metadata?.metro?.functionMap ??
      // Fallback to deprecated explicitly-generated `functionMap`
      transformResult.functionMap ??
      null,
    hasCjsExports: resultMetadata?.hasCjsExports,
    reactClientReference: resultMetadata?.reactClientReference,
    expoDomComponentReference: resultMetadata?.expoDomComponentReference,
  };

  return await transformJS(jsFile, context);
}

async function transformJSON(
  file: JSONFile,
  { options, config }: TransformationContext
): Promise<ExpoTransformResponse> {
  let code =
    config.unstable_disableModuleWrapping === true
      ? JsFileWrapping.jsonToCommonJS(file.code)
      : JsFileWrapping.wrapJson(file.code, config.globalPrefix);
  let map: MetroSourceMapSegmentTuple[] = [];

  const minify = shouldMinify(options);

  if (minify) {
    ({ map, code } = await minifyCode(config, file.filename, code, file.code, map));
  }

  let jsType: JSFileType;

  if (file.type === 'asset') {
    jsType = 'js/module/asset';
  } else if (file.type === 'script') {
    jsType = 'js/script';
  } else {
    jsType = 'js/module';
  }

  let lineCount;
  ({ lineCount, map } = countLinesAndTerminateMap(code, map));

  const output: ExpoJsOutput[] = [
    {
      data: { code, lineCount, map, functionMap: null },
      type: jsType,
    },
  ];

  return {
    dependencies: [],
    output,
  };
}

function getBabelTransformArgs(
  file: { filename: string; code: string },
  { options, config, projectRoot }: TransformationContext,
  plugins: PluginItem[] = []
): BabelTransformerArgs {
  const { inlineRequires: _, ...babelTransformerOptions } = options;
  return {
    filename: file.filename,
    options: {
      ...babelTransformerOptions,
      enableBabelRCLookup: config.enableBabelRCLookup,
      enableBabelRuntime: config.enableBabelRuntime,
      hermesParser: config.hermesParser,
      projectRoot,
      publicPath: config.publicPath,
      globalPrefix: config.globalPrefix,
      platform: babelTransformerOptions.platform ?? null,
    },
    plugins,
    src: file.code,
  };
}

export async function transform(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<ExpoTransformResponse> {
  const context: TransformationContext = {
    config,
    projectRoot,
    options,
  };
  const sourceCode = data.toString('utf8');

  const { unstable_dependencyMapReservedName } = config;
  if (unstable_dependencyMapReservedName != null) {
    const position = sourceCode.indexOf(unstable_dependencyMapReservedName);
    if (position > -1) {
      throw new SyntaxError(
        'Source code contains the reserved string `' +
          unstable_dependencyMapReservedName +
          '` at character offset ' +
          position
      );
    }
  }

  if (filename.endsWith('.json')) {
    const jsonFile: JSONFile = {
      filename,
      inputFileSize: data.length,
      code: sourceCode,
      type: options.type,
    };

    return transformJSON(jsonFile, context);
  }

  if (options.type === 'asset') {
    const file: AssetFile = {
      filename,
      inputFileSize: data.length,
      code: sourceCode,
      type: options.type,
    };

    return transformAsset(file, context);
  }

  const file: ExpoJSFile = {
    filename,
    inputFileSize: data.length,
    code: sourceCode,
    type: options.type === 'script' ? 'js/script' : 'js/module',
    functionMap: null,
  };

  return transformJSWithBabel(file, context);
}

export function getCacheKey(config: JsTransformerConfig): string {
  const { babelTransformerPath, minifierPath, ...remainingConfig } = config;

  const filesKey = getMetroCacheKey([
    require.resolve(babelTransformerPath),
    require.resolve(minifierPath),
    require.resolve('metro-transform-worker/src/utils/getMinifier'),
    require.resolve('./collect-dependencies'),
    require.resolve('./asset-transformer'),
    require.resolve('./resolveOptions'),
    require.resolve('metro/src/ModuleGraph/worker/generateImportNames'),
    require.resolve('metro/src/ModuleGraph/worker/JsFileWrapping'),
    ...metroTransformPlugins.getTransformPluginCacheKeyFiles(),
  ]);

  const babelTransformer = require(babelTransformerPath);
  return [
    filesKey,
    stableHash(remainingConfig).toString('hex'),
    babelTransformer.getCacheKey ? babelTransformer.getCacheKey() : '',
  ].join('$');
}

/**
 * Produces a Babel template that transforms an "import(...)" call into a
 * "require(...)" call to the asyncRequire specified.
 */
const makeShimAsyncRequireTemplate = template.expression(`require(ASYNC_REQUIRE_MODULE_PATH)`);

type InternalDependency = any;

const disabledDependencyTransformer: DependencyTransformer = {
  transformSyncRequire: (path) => {},
  transformImportMaybeSyncCall: () => {},
  transformImportCall: (path: NodePath, dependency: InternalDependency, state: State) => {
    // HACK: Ensure the async import code is included in the bundle when an import() call is found.
    let topParent = path;
    while (topParent.parentPath) {
      topParent = topParent.parentPath;
    }

    // @ts-expect-error
    if (topParent._handled) {
      return;
    }

    path.insertAfter(
      makeShimAsyncRequireTemplate({
        ASYNC_REQUIRE_MODULE_PATH: nullthrows(state.asyncRequireModulePathStringLiteral),
      })
    );
    // @ts-expect-error: Prevent recursive loop
    topParent._handled = true;
  },
  transformPrefetch: () => {},
  transformIllegalDynamicRequire: () => {},
};

export function collectDependenciesForShaking(
  ast: babylon.ParseResult<t.File>,
  options: CollectDependenciesOptions
) {
  const collectDependenciesOptions = {
    ...options,

    // If tree shaking is enabled, then preserve the original require calls.
    // This ensures require.context calls are not broken.
    collectOnly: true,
  };

  return collectDependencies(ast, {
    ...collectDependenciesOptions,
    // This setting shouldn't be shared with the tree shaking transformer.
    dependencyTransformer: disabledDependencyTransformer,
  });
}
