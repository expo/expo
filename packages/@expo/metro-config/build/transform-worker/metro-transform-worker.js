"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "JsTransformOptions", {
  enumerable: true,
  get: function () {
    return _metroTransformWorker().JsTransformOptions;
  }
});
exports.getCacheKey = getCacheKey;
exports.transform = transform;
function _core() {
  const data = require("@babel/core");
  _core = function () {
    return data;
  };
  return data;
}
function _generator() {
  const data = _interopRequireDefault(require("@babel/generator"));
  _generator = function () {
    return data;
  };
  return data;
}
function babylon() {
  const data = _interopRequireWildcard(require("@babel/parser"));
  babylon = function () {
    return data;
  };
  return data;
}
function types() {
  const data = _interopRequireWildcard(require("@babel/types"));
  types = function () {
    return data;
  };
  return data;
}
function _JsFileWrapping() {
  const data = _interopRequireDefault(require("metro/src/ModuleGraph/worker/JsFileWrapping"));
  _JsFileWrapping = function () {
    return data;
  };
  return data;
}
function _collectDependencies() {
  const data = _interopRequireWildcard(require("metro/src/ModuleGraph/worker/collectDependencies"));
  _collectDependencies = function () {
    return data;
  };
  return data;
}
function _generateImportNames() {
  const data = _interopRequireDefault(require("metro/src/ModuleGraph/worker/generateImportNames"));
  _generateImportNames = function () {
    return data;
  };
  return data;
}
function _countLines() {
  const data = _interopRequireDefault(require("metro/src/lib/countLines"));
  _countLines = function () {
    return data;
  };
  return data;
}
function _metroCache() {
  const data = require("metro-cache");
  _metroCache = function () {
    return data;
  };
  return data;
}
function _metroCacheKey() {
  const data = _interopRequireDefault(require("metro-cache-key"));
  _metroCacheKey = function () {
    return data;
  };
  return data;
}
function _metroSourceMap() {
  const data = require("metro-source-map");
  _metroSourceMap = function () {
    return data;
  };
  return data;
}
function _metroTransformPlugins() {
  const data = _interopRequireDefault(require("metro-transform-plugins"));
  _metroTransformPlugins = function () {
    return data;
  };
  return data;
}
function _metroTransformWorker() {
  const data = require("metro-transform-worker");
  _metroTransformWorker = function () {
    return data;
  };
  return data;
}
function _getMinifier() {
  const data = _interopRequireDefault(require("metro-transform-worker/src/utils/getMinifier"));
  _getMinifier = function () {
    return data;
  };
  return data;
}
function _nodeAssert() {
  const data = _interopRequireDefault(require("node:assert"));
  _nodeAssert = function () {
    return data;
  };
  return data;
}
function assetTransformer() {
  const data = _interopRequireWildcard(require("./asset-transformer"));
  assetTransformer = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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

// asserts non-null
function nullthrows(x, message) {
  (0, _nodeAssert().default)(x != null, message);
  return x;
}
function getDynamicDepsBehavior(inPackages, filename) {
  switch (inPackages) {
    case 'reject':
      return 'reject';
    case 'throwAtRuntime':
      return /(?:^|[/\\])node_modules[/\\]/.test(filename) ? inPackages : 'reject';
    default:
      throw new Error(`invalid value for dynamic deps behavior: \`${inPackages}\``);
  }
}
const minifyCode = async (config, projectRoot, filename, code, source, map, reserved = []) => {
  const sourceMap = (0, _metroSourceMap().fromRawMappings)([{
    code,
    source,
    map,
    // functionMap is overridden by the serializer
    functionMap: null,
    path: filename,
    // isIgnored is overriden by the serializer
    isIgnored: false
  }]).toMap(undefined, {});
  const minify = (0, _getMinifier().default)(config.minifierPath);
  try {
    const minified = await minify({
      code,
      map: sourceMap,
      filename,
      reserved,
      config: config.minifierConfig
    });
    return {
      code: minified.code,
      map: minified.map ? (0, _metroSourceMap().toBabelSegments)(minified.map).map(_metroSourceMap().toSegmentTuple) : []
    };
  } catch (error) {
    if (error.constructor.name === 'JS_Parse_Error') {
      throw new Error(`${error.message} in file ${filename} at ${error.line}:${error.col}`);
    }
    throw error;
  }
};
const disabledDependencyTransformer = {
  transformSyncRequire: () => {},
  transformImportCall: () => {},
  transformPrefetch: () => {},
  transformIllegalDynamicRequire: () => {}
};
class InvalidRequireCallError extends Error {
  constructor(innerError, filename) {
    super(`${filename}:${innerError.message}`);
    this.innerError = innerError;
    this.filename = filename;
  }
}
async function transformJS(file, {
  config,
  options,
  projectRoot
}) {
  var _file$ast;
  // Transformers can output null ASTs (if they ignore the file). In that case
  // we need to parse the module source code to get their AST.
  let ast = (_file$ast = file.ast) !== null && _file$ast !== void 0 ? _file$ast : babylon().parse(file.code, {
    sourceType: 'unambiguous'
  });

  // NOTE(EvanBacon): This can be really expensive on larger files. We should replace it with a cheaper alternative that just iterates and matches.
  const {
    importDefault,
    importAll
  } = (0, _generateImportNames().default)(ast);

  // Add "use strict" if the file was parsed as a module, and the directive did
  // not exist yet.
  const {
    directives
  } = ast.program;
  if (ast.program.sourceType === 'module' && directives != null && directives.findIndex(d => d.value.value === 'use strict') === -1) {
    directives.push(types().directive(types().directiveLiteral('use strict')));
  }

  // Perform the import-export transform (in case it's still needed), then
  // fold requires and perform constant folding (if in dev).
  const plugins = [];
  const babelPluginOpts = {
    ...options,
    inlineableCalls: [importDefault, importAll],
    importDefault,
    importAll
  };

  // NOTE(EvanBacon): This is effectively a replacement for the `@babel/plugin-transform-modules-commonjs`
  // plugin that's running in `@@react-native/babel-preset`, but with shared names for inlining requires.
  if (options.experimentalImportSupport === true) {
    plugins.push([_metroTransformPlugins().default.importExportPlugin, babelPluginOpts]);
  }

  // NOTE(EvanBacon): This can basically never be safely enabled because it doesn't respect side-effects and
  // has no ability to respect side-effects because the transformer hasn't collected all dependencies yet.
  if (options.inlineRequires) {
    plugins.push([_metroTransformPlugins().default.inlineRequiresPlugin, {
      ...babelPluginOpts,
      ignoredRequires: options.nonInlinedRequires
    }]);
  }

  // NOTE(EvanBacon): We apply this conditionally in `babel-preset-expo` with other AST transforms.
  // plugins.push([metroTransformPlugins.inlinePlugin, babelPluginOpts]);

  // TODO: This MUST be run even though no plugins are added, otherwise the babel runtime generators are broken.
  // if (plugins.length) {
  ast = nullthrows(
  // @ts-expect-error
  (0, _core().transformFromAstSync)(ast, '', {
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
    cloneInputAst: true
  }).ast);
  // }

  if (!options.dev) {
    // Run the constant folding plugin in its own pass, avoiding race conditions
    // with other plugins that have exit() visitors on Program (e.g. the ESM
    // transform).
    ast = nullthrows(
    // @ts-expect-error
    (0, _core().transformFromAstSync)(ast, '', {
      ast: true,
      babelrc: false,
      code: false,
      configFile: false,
      comments: true,
      filename: file.filename,
      plugins: [[_metroTransformPlugins().default.constantFoldingPlugin, babelPluginOpts]],
      sourceMaps: false,
      cloneInputAst: false
    }).ast);
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
    wrappedAst = _JsFileWrapping().default.wrapPolyfill(ast);
  } else {
    try {
      const opts = {
        asyncRequireModulePath: config.asyncRequireModulePath,
        dependencyTransformer: config.unstable_disableModuleWrapping === true ? disabledDependencyTransformer : undefined,
        dynamicRequires: getDynamicDepsBehavior(config.dynamicDepsInPackages, file.filename),
        inlineableCalls: [importDefault, importAll],
        keepRequireNames: options.dev,
        allowOptionalDependencies: config.allowOptionalDependencies,
        dependencyMapName: config.unstable_dependencyMapReservedName,
        unstable_allowRequireContext: config.unstable_allowRequireContext
      };
      ({
        ast,
        dependencies,
        dependencyMapName
      } = (0, _collectDependencies().default)(ast, opts));
    } catch (error) {
      if (error instanceof _collectDependencies().InvalidRequireCallError) {
        throw new InvalidRequireCallError(error, file.filename);
      }
      throw error;
    }
    if (config.unstable_disableModuleWrapping === true) {
      wrappedAst = ast;
    } else {
      // TODO: Replace this with a cheaper transform that doesn't require AST.
      ({
        ast: wrappedAst
      } = _JsFileWrapping().default.wrapModule(ast, importDefault, importAll, dependencyMapName, config.globalPrefix));
    }
  }
  const minify = options.minify && options.unstable_transformProfile !== 'hermes-canary' && options.unstable_transformProfile !== 'hermes-stable';
  const reserved = [];
  if (config.unstable_dependencyMapReservedName != null) {
    reserved.push(config.unstable_dependencyMapReservedName);
  }
  if (minify && file.inputFileSize <= config.optimizationSizeLimit && !config.unstable_disableNormalizePseudoGlobals) {
    // NOTE(EvanBacon): Simply pushing this function will mutate the AST, so it must run before the `generate` step!!
    reserved.push(..._metroTransformPlugins().default.normalizePseudoGlobals(wrappedAst, {
      reservedNames: reserved
    }));
  }
  const result = (0, _generator().default)(wrappedAst, {
    comments: true,
    compact: config.unstable_compactOutput,
    filename: file.filename,
    retainLines: false,
    sourceFileName: file.filename,
    sourceMaps: true
  }, file.code);

  // @ts-expect-error: incorrectly typed upstream
  let map = result.rawMappings ? result.rawMappings.map(_metroSourceMap().toSegmentTuple) : [];
  let code = result.code;
  if (minify) {
    ({
      map,
      code
    } = await minifyCode(config, projectRoot, file.filename, result.code, file.code, map, reserved));
  }
  const output = [{
    data: {
      code,
      lineCount: (0, _countLines().default)(code),
      map,
      functionMap: file.functionMap
    },
    type: file.type
  }];
  return {
    dependencies,
    output
  };
}

/** Transforms an asset file. */
async function transformAsset(file, context) {
  const {
    assetRegistryPath,
    assetPlugins
  } = context.config;

  // TODO: Add web asset hashing in production.
  const result = await assetTransformer().transform(getBabelTransformArgs(file, context), assetRegistryPath, assetPlugins);
  const jsFile = {
    ...file,
    type: 'js/module/asset',
    ast: result.ast,
    functionMap: null
  };
  return transformJS(jsFile, context);
}

/**
 * Transforms a JavaScript file with Babel before processing the file with
 * the generic JavaScript transformation.
 */
async function transformJSWithBabel(file, context) {
  var _ref, _transformResult$meta, _transformResult$meta2, _transformResult$meta3;
  const {
    babelTransformerPath
  } = context.config;
  const transformer = require(babelTransformerPath);
  const transformResult = await transformer.transform(
  // functionMapBabelPlugin populates metadata.metro.functionMap
  getBabelTransformArgs(file, context, [_metroSourceMap().functionMapBabelPlugin]));
  const jsFile = {
    ...file,
    ast: transformResult.ast,
    functionMap: (_ref = (_transformResult$meta = (_transformResult$meta2 = transformResult.metadata) === null || _transformResult$meta2 === void 0 ? void 0 : (_transformResult$meta3 = _transformResult$meta2.metro) === null || _transformResult$meta3 === void 0 ? void 0 : _transformResult$meta3.functionMap) !== null && _transformResult$meta !== void 0 ? _transformResult$meta :
    // Fallback to deprecated explicitly-generated `functionMap`
    transformResult.functionMap) !== null && _ref !== void 0 ? _ref : null
  };
  return await transformJS(jsFile, context);
}
async function transformJSON(file, {
  options,
  config,
  projectRoot
}) {
  let code = config.unstable_disableModuleWrapping === true ? _JsFileWrapping().default.jsonToCommonJS(file.code) : _JsFileWrapping().default.wrapJson(file.code, config.globalPrefix);
  let map = [];

  // TODO: When we can reuse transformJS for JSON, we should not derive `minify` separately.
  const minify = options.minify && options.unstable_transformProfile !== 'hermes-canary' && options.unstable_transformProfile !== 'hermes-stable';
  if (minify) {
    ({
      map,
      code
    } = await minifyCode(config, projectRoot, file.filename, code, file.code, map));
  }
  let jsType;
  if (file.type === 'asset') {
    jsType = 'js/module/asset';
  } else if (file.type === 'script') {
    jsType = 'js/script';
  } else {
    jsType = 'js/module';
  }
  const output = [{
    data: {
      code,
      lineCount: (0, _countLines().default)(code),
      map,
      functionMap: null
    },
    type: jsType
  }];
  return {
    dependencies: [],
    output
  };
}
function getBabelTransformArgs(file, {
  options,
  config,
  projectRoot
}, plugins = []) {
  var _babelTransformerOpti;
  const {
    inlineRequires: _,
    ...babelTransformerOptions
  } = options;
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
      platform: (_babelTransformerOpti = babelTransformerOptions.platform) !== null && _babelTransformerOpti !== void 0 ? _babelTransformerOpti : null
    },
    plugins,
    src: file.code
  };
}
async function transform(config, projectRoot, filename, data, options) {
  const context = {
    config,
    projectRoot,
    options
  };
  const sourceCode = data.toString('utf8');
  const {
    unstable_dependencyMapReservedName
  } = config;
  if (unstable_dependencyMapReservedName != null) {
    const position = sourceCode.indexOf(unstable_dependencyMapReservedName);
    if (position > -1) {
      throw new SyntaxError('Source code contains the reserved string `' + unstable_dependencyMapReservedName + '` at character offset ' + position);
    }
  }
  if (filename.endsWith('.json')) {
    const jsonFile = {
      filename,
      inputFileSize: data.length,
      code: sourceCode,
      type: options.type
    };
    return transformJSON(jsonFile, context);
  }
  if (options.type === 'asset') {
    const file = {
      filename,
      inputFileSize: data.length,
      code: sourceCode,
      type: options.type
    };
    return transformAsset(file, context);
  }
  const file = {
    filename,
    inputFileSize: data.length,
    code: sourceCode,
    type: options.type === 'script' ? 'js/script' : 'js/module',
    functionMap: null
  };
  return transformJSWithBabel(file, context);
}
function getCacheKey(config) {
  const {
    babelTransformerPath,
    minifierPath,
    ...remainingConfig
  } = config;
  const filesKey = (0, _metroCacheKey().default)([require.resolve(babelTransformerPath), require.resolve(minifierPath), require.resolve('metro-transform-worker/src/utils/getMinifier'), require.resolve('./asset-transformer'), require.resolve('metro/src/ModuleGraph/worker/generateImportNames'), require.resolve('metro/src/ModuleGraph/worker/JsFileWrapping'), ..._metroTransformPlugins().default.getTransformPluginCacheKeyFiles()]);
  const babelTransformer = require(babelTransformerPath);
  return [filesKey, (0, _metroCache().stableHash)(remainingConfig).toString('hex'), babelTransformer.getCacheKey ? babelTransformer.getCacheKey() : ''].join('$');
}
//# sourceMappingURL=metro-transform-worker.js.map