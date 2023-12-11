"use strict";

function _nodeAssert() {
  const data = _interopRequireDefault(require("node:assert"));
  _nodeAssert = function () {
    return data;
  };
  return data;
}
function _nodeCrypto() {
  const data = _interopRequireDefault(require("node:crypto"));
  _nodeCrypto = function () {
    return data;
  };
  return data;
}
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _loadBabelConfig() {
  const data = require("./loadBabelConfig");
  _loadBabelConfig = function () {
    return data;
  };
  return data;
}
function _transformSync() {
  const data = require("./transformSync");
  _transformSync = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// A fork of the upstream babel-transformer that uses Expo-specific babel defaults
// and adds support for web and Node.js environments via `isServer` on the Babel caller.

const cacheKeyParts = [_nodeFs().default.readFileSync(__filename), require('babel-preset-fbjs/package.json').version];
function isCustomTruthy(value) {
  return value === true || value === 'true';
}
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
const memoizeWarning = memoize(message => {
  console.warn(message);
});
function getBabelCaller({
  filename,
  options
}) {
  var _options$customTransf, _options$customTransf2, _options$customTransf3, _options$customTransf4, _options$customTransf5, _options$customTransf6;
  const isNodeModule = filename.includes('node_modules');
  const isServer = ((_options$customTransf = options.customTransformOptions) === null || _options$customTransf === void 0 ? void 0 : _options$customTransf.environment) === 'node';
  const routerRoot = typeof ((_options$customTransf2 = options.customTransformOptions) === null || _options$customTransf2 === void 0 ? void 0 : _options$customTransf2.routerRoot) === 'string' ? decodeURI(options.customTransformOptions.routerRoot) : undefined;
  if (routerRoot == null) {
    memoizeWarning('Missing transform.routerRoot option in Metro bundling request, falling back to `app` as routes directory.');
  }
  return {
    name: 'metro',
    bundler: 'metro',
    platform: options.platform,
    // Empower the babel preset to know the env it's bundling for.
    // Metro automatically updates the cache to account for the custom transform options.
    isServer,
    // The base url to make requests from, used for hosting from non-standard locations.
    baseUrl: typeof ((_options$customTransf3 = options.customTransformOptions) === null || _options$customTransf3 === void 0 ? void 0 : _options$customTransf3.baseUrl) === 'string' ? decodeURI(options.customTransformOptions.baseUrl) : '',
    // Ensure we always use a mostly-valid router root.
    routerRoot: routerRoot !== null && routerRoot !== void 0 ? routerRoot : 'app',
    isDev: options.dev,
    // This value indicates if the user has disabled the feature or not.
    // Other criteria may still cause the feature to be disabled, but all inputs used are
    // already considered in the cache key.
    preserveEnvVars: isCustomTruthy((_options$customTransf4 = options.customTransformOptions) === null || _options$customTransf4 === void 0 ? void 0 : _options$customTransf4.preserveEnvVars) ? true : undefined,
    asyncRoutes: isCustomTruthy((_options$customTransf5 = options.customTransformOptions) === null || _options$customTransf5 === void 0 ? void 0 : _options$customTransf5.asyncRoutes) ? true : undefined,
    // Pass the engine to babel so we can automatically transpile for the correct
    // target environment.
    engine: (_options$customTransf6 = options.customTransformOptions) === null || _options$customTransf6 === void 0 ? void 0 : _options$customTransf6.engine,
    // Provide the project root for accurately reading the Expo config.
    projectRoot: options.projectRoot,
    isNodeModule,
    isHMREnabled: options.hot,
    // Set the standard Babel flag to disable ESM transformations.
    supportsStaticESM: options.experimentalImportSupport
  };
}
const transform = ({
  filename,
  src,
  options,
  // `plugins` is used for `functionMapBabelPlugin` from `metro-source-map`. Could make sense to move this to `babel-preset-expo` too.
  plugins
}) => {
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';
  try {
    const babelConfig = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',
      // The output we want from Babel methods
      ast: true,
      code: false,
      // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
      // Hermes parsing, but this defaults to cloning the AST which increases
      // the transformation time by a fair amount.
      // You get this behavior by default when using Babel's `transform` method directly.
      cloneInputAst: false,
      // Options for debugging
      cwd: options.projectRoot,
      filename,
      highlightCode: true,
      // Load the project babel config file.
      ...(0, _loadBabelConfig().loadBabelConfig)(options),
      babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
      plugins,
      // NOTE(EvanBacon): We heavily leverage the caller functionality to mutate the babel config.
      // This compensates for the lack of a format plugin system in Metro. Users can modify the
      // all (most) of the transforms in their local Babel config.
      // This also helps us keep the transform layers small and focused on a single task. We can also use this to
      // ensure the Babel config caching is more accurate.
      // Additionally, by moving everything Babel-related to the Babel preset, it makes it easier for users to reason
      // about the requirements of an Expo project, making it easier to migrate to other transpilers in the future.
      caller: getBabelCaller({
        filename,
        options
      })
    };
    const result = (0, _transformSync().transformSync)(src, babelConfig, options);

    // The result from `transformFromAstSync` can be null (if the file is ignored)
    if (!result) {
      // BabelTransformer specifies that the `ast` can never be null but
      // the function returns here. Discovered when typing `BabelNode`.
      return {
        ast: null
      };
    }
    (0, _nodeAssert().default)(result.ast);
    return {
      ast: result.ast,
      metadata: result.metadata
    };
  } finally {
    if (OLD_BABEL_ENV) {
      process.env.BABEL_ENV = OLD_BABEL_ENV;
    }
  }
};
function getCacheKey() {
  const key = _nodeCrypto().default.createHash('md5');
  cacheKeyParts.forEach(part => key.update(part));
  return key.digest('hex');
}
const babelTransformer = {
  transform,
  getCacheKey
};
module.exports = babelTransformer;
//# sourceMappingURL=babel-transformer.js.map