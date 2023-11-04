/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with speed optimizations.
 * https://github.com/facebook/metro/blob/1fb04dea1982e73c1c1d25db0db81b2088a45bfc/packages/metro-transform-worker/src/index.js
 */
import { transformFromAstSync } from '@babel/core';
import generate from '@babel/generator';
import * as babylon from '@babel/parser';
import * as types from '@babel/types';
import { stableHash } from 'metro-cache';
// @ts-expect-error
import getMetroCacheKey from 'metro-cache-key';
import {
  // @ts-expect-error
  fromRawMappings,
  // @ts-expect-error
  functionMapBabelPlugin,
  toBabelSegments,
  toSegmentTuple,
} from 'metro-source-map';
import metroTransformPlugins from 'metro-transform-plugins';
import { JsOutput, JsTransformerConfig, JsTransformOptions, Type } from 'metro-transform-worker';
import getMinifier from 'metro-transform-worker/src/utils/getMinifier';
import countLines from 'metro/src/lib/countLines';

// @ts-expect-error
import collectDependencies, {
  // @ts-expect-error
  InvalidRequireCallError as InternalInvalidRequireCallError,
} from 'metro/src/ModuleGraph/worker/collectDependencies';
import generateImportNames from 'metro/src/ModuleGraph/worker/generateImportNames';
import JsFileWrapping from 'metro/src/ModuleGraph/worker/JsFileWrapping';

import type { ParseResult, PluginItem } from '@babel/core';
import type { BabelTransformer, BabelTransformerArgs } from 'metro-babel-transformer';
import type { FBSourceFunctionMap, MetroSourceMapSegmentTuple } from 'metro-source-map';
import type { TransformResultDependency } from 'metro/src/DeltaBundler';
import type {
  DependencyTransformer,
  DynamicRequiresBehavior,
} from 'metro/src/ModuleGraph/worker/collectDependencies';

type Path = string;

interface BaseFile {
  readonly code: string;
  readonly filename: Path;
  readonly inputFileSize: number;
}

interface AssetFile extends BaseFile {
  readonly type: 'asset';
}

type JSFileType = 'js/script' | 'js/module' | 'js/module/asset';

interface JSFile extends BaseFile {
  readonly ast?: ParseResult | null;
  readonly type: JSFileType;
  readonly functionMap: FBSourceFunctionMap | null;
}

interface JSONFile extends BaseFile {
  readonly type: Type;
}

interface TransformationContext {
  readonly config: JsTransformerConfig;
  readonly projectRoot: Path;
  readonly options: JsTransformOptions;
}

interface TransformResponse {
  readonly dependencies: ReadonlyArray<TransformResultDependency>;
  readonly output: ReadonlyArray<JsOutput>;
}

// asserts non-null
function nullthrows<T extends object>(x: T | null, message?: string): NonNullable<T> {
  if (x != null) {
    return x;
  }
  var error = new Error(message ?? 'Got unexpected ' + x);
  // @ts-expect-error
  error.framesToPop = 1; // Skip nullthrows's own stack frame.
  throw error;
}

function getDynamicDepsBehavior(
  inPackages: DynamicRequiresBehavior,
  filename: string
): DynamicRequiresBehavior {
  switch (inPackages) {
    case 'reject':
      return 'reject';
    case 'throwAtRuntime':
      const isPackage = /(?:^|[/\\])node_modules[/\\]/.test(filename);
      return isPackage ? inPackages : 'reject';
    default:
      throw new Error(`invalid value for dynamic deps behavior: \`${inPackages}\``);
  }
}

const minifyCode = async (
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  code: string,
  source: string,
  map: Array<MetroSourceMapSegmentTuple>,
  reserved: Array<string> = []
): Promise<{
  code: string;
  map: Array<MetroSourceMapSegmentTuple>;
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

const disabledDependencyTransformer: DependencyTransformer = {
  transformSyncRequire: () => void 0,
  transformImportCall: () => void 0,
  transformPrefetch: () => void 0,
  transformIllegalDynamicRequire: () => void 0,
};

class InvalidRequireCallError extends Error {
  innerError: InternalInvalidRequireCallError;
  filename: string;

  constructor(innerError: InternalInvalidRequireCallError, filename: string) {
    super(`${filename}:${innerError.message}`);
    this.innerError = innerError;
    this.filename = filename;
  }
}

async function transformJS(
  file: JSFile,
  { config, options, projectRoot }: TransformationContext
): Promise<TransformResponse> {
  // Transformers can output null ASTs (if they ignore the file). In that case
  // we need to parse the module source code to get their AST.
  let ast = file.ast ?? babylon.parse(file.code, { sourceType: 'unambiguous' });

  // const early = types.cloneNode(ast);

  const { importDefault, importAll } = generateImportNames(ast);

  // Add "use strict" if the file was parsed as a module, and the directive did
  // not exist yet.
  const { directives } = ast.program;

  const treeshaking = options.customTransformOptions?.treeshake === 'true';

  if (
    ast.program.sourceType === 'module' &&
    directives != null &&
    directives.findIndex((d) => d.value.value === 'use strict') === -1
  ) {
    directives.push(types.directive(types.directiveLiteral('use strict')));
  }

  // Perform the import-export transform (in case it's still needed), then
  // fold requires and perform constant folding (if in dev).
  const plugins: PluginItem[] = [];
  const babelPluginOpts = {
    ...options,
    inlineableCalls: [importDefault, importAll],
    importDefault,
    importAll,
  };

  if (options.experimentalImportSupport === true) {
    plugins.push([metroTransformPlugins.importExportPlugin, babelPluginOpts]);
  }

  if (options.inlineRequires) {
    plugins.push([
      require('metro-transform-plugins/src/inline-plugin'),
      // metroTransformPlugins.inlineRequiresPlugin,
      {
        ...babelPluginOpts,
        ignoredRequires: options.nonInlinedRequires,
      },
    ]);
  }

  const minify =
    options.minify &&
    options.unstable_transformProfile !== 'hermes-canary' &&
    options.unstable_transformProfile !== 'hermes-stable';

  if (minify) {
    plugins.push([metroTransformPlugins.inlinePlugin, babelPluginOpts]);
  }

  if (plugins.length) {
    ast = nullthrows<babylon.ParseResult<types.File>>(
      // @ts-expect-error
      transformFromAstSync(ast, '', {
        ast: true,
        babelrc: false,
        code: false,
        configFile: false,
        comments: true,
        filename: file.filename,
        plugins,
        sourceMaps: false,
        // Not-Cloning the input AST here should be safe because other code paths above this call
        // are mutating the AST as well and no code is depending on the original AST.
        // However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
        // either because one of the plugins is doing something funky or Babel messes up some caches.
        // Make sure to test the above mentioned case before flipping the flag back to false.
        cloneInputAst: true,
      }).ast
    );
  }

  if (!options.dev) {
    // Run the constant folding plugin in its own pass, avoiding race conditions
    // with other plugins that have exit() visitors on Program (e.g. the ESM
    // transform).
    ast = nullthrows<babylon.ParseResult<types.File>>(
      // @ts-expect-error
      transformFromAstSync(ast, '', {
        ast: true,
        babelrc: false,
        code: false,
        configFile: false,
        comments: true,
        filename: file.filename,
        plugins: [[metroTransformPlugins.constantFoldingPlugin, babelPluginOpts]],
        sourceMaps: false,
        cloneInputAst: false,
      }).ast
    );
  }

  let dependencyMapName = '';
  let dependencies;
  let wrappedAst;

  // If the module to transform is a script (meaning that is not part of the
  // dependency graph and it code will just be prepended to the bundle modules),
  // we need to wrap it differently than a commonJS module (also, scripts do
  // not have dependencies).
  if (file.type === 'js/script') {
    dependencies = [];
    wrappedAst = JsFileWrapping.wrapPolyfill(ast);
  } else {
    try {
      const opts = {
        asyncRequireModulePath: config.asyncRequireModulePath,
        dependencyTransformer:
          config.unstable_disableModuleWrapping === true
            ? disabledDependencyTransformer
            : undefined,
        dynamicRequires: getDynamicDepsBehavior(config.dynamicDepsInPackages, file.filename),
        inlineableCalls: [importDefault, importAll],
        keepRequireNames: options.dev,
        allowOptionalDependencies: config.allowOptionalDependencies,
        dependencyMapName: config.unstable_dependencyMapReservedName,
        unstable_allowRequireContext: config.unstable_allowRequireContext,
      };
      // @ts-expect-error
      ({ ast, dependencies, dependencyMapName } = collectDependencies(ast, opts));
    } catch (error) {
      if (error instanceof InternalInvalidRequireCallError) {
        throw new InvalidRequireCallError(error, file.filename);
      }
      throw error;
    }

    if (config.unstable_disableModuleWrapping === true) {
      wrappedAst = ast;
    } else {
      ({ ast: wrappedAst } = JsFileWrapping.wrapModule(
        ast,
        importDefault,
        importAll,
        dependencyMapName,
        config.globalPrefix
      ));
    }
  }

  const reserved = [];
  if (config.unstable_dependencyMapReservedName != null) {
    reserved.push(config.unstable_dependencyMapReservedName);
  }
  if (
    minify &&
    file.inputFileSize <= config.optimizationSizeLimit &&
    !config.unstable_disableNormalizePseudoGlobals
  ) {
    reserved.push(
      ...metroTransformPlugins.normalizePseudoGlobals(wrappedAst, {
        reservedNames: reserved,
      })
    );
  }

  const result = generate(
    types.cloneNode(wrappedAst),
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

  if (minify) {
    ({ map, code } = await minifyCode(
      config,
      projectRoot,
      file.filename,
      result.code,
      file.code,
      map,
      reserved
    ));
  }

  const output: Array<JsOutput> = [
    {
      data: {
        code,
        lineCount: countLines(code),
        map,
        functionMap: file.functionMap,
        ...(config.unstable_disableModuleWrapping && file.type === 'js/module' && !minify
          ? {
              // ast: babylon.parse(code, { sourceType: 'unambiguous' }),
              ast: wrappedAst,
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

/**
 * Transforms an asset file
 */
async function transformAsset(
  file: AssetFile,
  context: TransformationContext
): Promise<TransformResponse> {
  const assetTransformer = require('metro-transform-worker/src/utils/assetTransformer');
  const { assetRegistryPath, assetPlugins } = context.config;

  const result = await assetTransformer.transform(
    getBabelTransformArgs(file, context),
    assetRegistryPath,
    assetPlugins
  );

  const jsFile: JSFile = {
    ...file,
    type: 'js/module/asset',
    ast: result.ast,
    functionMap: null,
  };

  return transformJS(jsFile, context);
}

/**
 * Transforms a JavaScript file with Babel before processing the file with
 * the generic JavaScript transformation.
 */
async function transformJSWithBabel(
  file: JSFile,
  context: TransformationContext
): Promise<TransformResponse> {
  const { babelTransformerPath } = context.config;
  // $FlowFixMe[unsupported-syntax] dynamic require
  const transformer: BabelTransformer = require(babelTransformerPath);

  const treeshaking = context.options.customTransformOptions?.treeshake === 'true';

  const transformResult = await transformer.transform(
    // functionMapBabelPlugin populates metadata.metro.functionMap
    getBabelTransformArgs(file, context, [!treeshaking && functionMapBabelPlugin].filter(Boolean))
  );

  const jsFile: JSFile = {
    ...file,
    ast: transformResult.ast,
    functionMap:
      // @ts-expect-error: incorrectly typed upstream
      transformResult.metadata?.metro?.functionMap ??
      // Fallback to deprecated explicitly-generated `functionMap`
      transformResult.functionMap ??
      null,
  };

  return await transformJS(jsFile, context);
}

async function transformJSON(
  file: JSONFile,
  { options, config, projectRoot }: TransformationContext
): Promise<TransformResponse> {
  let code =
    config.unstable_disableModuleWrapping === true
      ? JsFileWrapping.jsonToCommonJS(file.code)
      : JsFileWrapping.wrapJson(file.code, config.globalPrefix);
  let map: Array<MetroSourceMapSegmentTuple> = [];

  // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
  const minify =
    options.minify &&
    options.unstable_transformProfile !== 'hermes-canary' &&
    options.unstable_transformProfile !== 'hermes-stable';

  if (minify) {
    ({ map, code } = await minifyCode(config, projectRoot, file.filename, code, file.code, map));
  }

  let jsType: JSFileType;

  if (file.type === 'asset') {
    jsType = 'js/module/asset';
  } else if (file.type === 'script') {
    jsType = 'js/script';
  } else {
    jsType = 'js/module';
  }

  const output: Array<JsOutput> = [
    {
      data: { code, lineCount: countLines(code), map, functionMap: null },
      type: jsType,
    },
  ];

  return {
    dependencies: [],
    output,
  };
}

function getBabelTransformArgs(
  file: { filename: Path; code: string },
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
      // @ts-expect-error: incorrectly typed upstream
      globalPrefix: config.globalPrefix,
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
): Promise<TransformResponse> {
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

    return await transformJSON(jsonFile, context);
  }

  if (options.type === 'asset') {
    const file: AssetFile = {
      filename,
      inputFileSize: data.length,
      code: sourceCode,
      type: options.type,
    };

    return await transformAsset(file, context);
  }

  const file: JSFile = {
    filename,
    inputFileSize: data.length,
    code: sourceCode,
    type: options.type === 'script' ? 'js/script' : 'js/module',
    functionMap: null,
  };

  return await transformJSWithBabel(file, context);
}

export function getCacheKey(config: JsTransformerConfig): string {
  const { babelTransformerPath, minifierPath, ...remainingConfig } = config;

  const filesKey = getMetroCacheKey([
    require.resolve(babelTransformerPath),
    require.resolve(minifierPath),
    require.resolve('metro-transform-worker/src/utils/getMinifier'),
    require.resolve('metro-transform-worker/src/utils/assetTransformer'),
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

// module.exports = {
//   transform,
//   getCacheKey,
// };
