"use strict";

function _hmr() {
  const data = _interopRequireDefault(require("@react-native/babel-preset/src/configs/hmr"));
  _hmr = function () {
    return data;
  };
  return data;
}
function _inlineRequires() {
  const data = _interopRequireDefault(require("babel-preset-fbjs/plugins/inline-requires"));
  _inlineRequires = function () {
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
function _nodePath() {
  const data = _interopRequireDefault(require("node:path"));
  _nodePath = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _babelCore() {
  const data = require("./babel-core");
  _babelCore = function () {
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

// @ts-expect-error

// @ts-expect-error

const cacheKeyParts = [_nodeFs().default.readFileSync(__filename), require('babel-preset-fbjs/package.json').version];

// TS detection conditions copied from @react-native/babel-preset
function isTypeScriptSource(fileName) {
  return !!fileName && fileName.endsWith('.ts');
}
function isTSXSource(fileName) {
  return !!fileName && fileName.endsWith('.tsx');
}
let babelPresetExpo = null;
function getBabelPresetExpo(projectRoot) {
  var _resolveFrom$silent;
  if (babelPresetExpo !== undefined) {
    return babelPresetExpo;
  }
  babelPresetExpo = (_resolveFrom$silent = _resolveFrom().default.silent(projectRoot, 'babel-preset-expo')) !== null && _resolveFrom$silent !== void 0 ? _resolveFrom$silent : null;
  return babelPresetExpo;
}

/**
 * Return a memoized function that checks for the existence of a
 * project level .babelrc file, and if it doesn't exist, reads the
 * default RN babelrc file and uses that.
 */
const getBabelRC = function () {
  let babelRC = null;

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  return function _getBabelRC({
    projectRoot,
    extendsBabelConfigPath,
    ...options
  }) {
    if (babelRC != null) {
      return babelRC;
    }
    babelRC = {
      plugins: [],
      extends: extendsBabelConfigPath
    };
    if (extendsBabelConfigPath) {
      return babelRC;
    }

    // Let's look for a babel config file in the project root.
    let projectBabelRCPath;

    // .babelrc
    if (projectRoot) {
      projectBabelRCPath = _nodePath().default.resolve(projectRoot, '.babelrc');
    }
    if (projectBabelRCPath) {
      // .babelrc.js
      if (!_nodeFs().default.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = _nodePath().default.resolve(projectRoot, '.babelrc.js');
      }

      // babel.config.js
      if (!_nodeFs().default.existsSync(projectBabelRCPath)) {
        projectBabelRCPath = _nodePath().default.resolve(projectRoot, 'babel.config.js');
      }

      // If we found a babel config file, extend our config off of it
      // otherwise the default config will be used
      if (_nodeFs().default.existsSync(projectBabelRCPath)) {
        babelRC.extends = projectBabelRCPath;
      }
    }

    // If a babel config file doesn't exist in the project then
    // the default preset for react-native will be used instead.
    if (!babelRC.extends) {
      const {
        experimentalImportSupport,
        ...presetOptions
      } = options;

      // Convert the options into the format expected by the Expo preset.
      const platformOptions = {
        // @ts-expect-error: This is how Metro works by default
        unstable_transformProfile: presetOptions.unstable_transformProfile,
        disableImportExportTransform: experimentalImportSupport,
        dev: presetOptions.dev,
        enableBabelRuntime: presetOptions.enableBabelRuntime
      };
      babelRC.presets = [[
      // NOTE(EvanBacon): Here we use the Expo babel wrapper instead of the default react-native preset.
      require('babel-preset-expo'), {
        web: platformOptions,
        native: platformOptions
        // lazyImports: presetOptions.lazyImportExportTransform,
      }]];
    }

    return babelRC;
  };
}();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename, options, plugins = []) {
  const babelRC = getBabelRC(options);
  const extraConfig = {
    babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
    code: false,
    cwd: options.projectRoot,
    filename,
    highlightCode: true
  };
  let config = {
    ...babelRC,
    ...extraConfig
  };

  // Add extra plugins
  const extraPlugins = [];
  if (options.inlineRequires) {
    extraPlugins.push(_inlineRequires().default);
  }
  config.plugins = extraPlugins.concat(config.plugins, plugins);
  const withExtraPlugins = config.plugins;
  if (options.dev && options.hot) {
    // Note: this intentionally doesn't include the path separator because
    // I'm not sure which one it should use on Windows, and false positives
    // are unlikely anyway. If you later decide to include the separator,
    // don't forget that the string usually *starts* with "node_modules" so
    // the first one often won't be there.
    const mayContainEditableReactComponents = !filename.includes('node_modules');
    if (mayContainEditableReactComponents) {
      const hmrConfig = (0, _hmr().default)();
      hmrConfig.plugins = withExtraPlugins.concat(hmrConfig.plugins);
      config = {
        ...config,
        ...hmrConfig
      };
    }
  }
  return {
    ...babelRC,
    ...config
  };
}
function isCustomTruthy(value) {
  return value === true || value === 'true';
}
const transform = ({
  filename,
  options,
  src,
  plugins
}) => {
  var _getBabelPresetExpo;
  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';

  // Ensure the default babel preset is Expo.
  options.extendsBabelConfigPath = (_getBabelPresetExpo = getBabelPresetExpo(options.projectRoot)) !== null && _getBabelPresetExpo !== void 0 ? _getBabelPresetExpo : undefined;
  try {
    var _options$customTransf, _options$customTransf2, _options$customTransf3, _options$customTransf4;
    const babelConfig = {
      // ES modules require sourceType='module' but OSS may not always want that
      sourceType: 'unambiguous',
      ...buildBabelConfig(filename, options, plugins),
      caller: {
        name: 'metro',
        // @ts-expect-error: Custom values passed to the caller.
        bundler: 'metro',
        platform: options.platform,
        // Empower the babel preset to know the env it's bundling for.
        // Metro automatically updates the cache to account for the custom transform options.
        isServer: ((_options$customTransf = options.customTransformOptions) === null || _options$customTransf === void 0 ? void 0 : _options$customTransf.environment) === 'node',
        // The base url to make requests from, used for hosting from non-standard locations.
        baseUrl: typeof ((_options$customTransf2 = options.customTransformOptions) === null || _options$customTransf2 === void 0 ? void 0 : _options$customTransf2.baseUrl) === 'string' ? decodeURI(options.customTransformOptions.baseUrl) : '',
        isDev: options.dev,
        // This value indicates if the user has disabled the feature or not.
        // Other criteria may still cause the feature to be disabled, but all inputs used are
        // already considered in the cache key.
        preserveEnvVars: isCustomTruthy((_options$customTransf3 = options.customTransformOptions) === null || _options$customTransf3 === void 0 ? void 0 : _options$customTransf3.preserveEnvVars) ? true : undefined,
        // Pass the engine to babel so we can automatically transpile for the correct
        // target environment.
        engine: (_options$customTransf4 = options.customTransformOptions) === null || _options$customTransf4 === void 0 ? void 0 : _options$customTransf4.engine,
        // Provide the project root for accurately reading the Expo config.
        projectRoot: options.projectRoot
      },
      ast: true,
      // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
      // Hermes parsing, but this defaults to cloning the AST which increases
      // the transformation time by a fair amount.
      // You get this behavior by default when using Babel's `transform` method directly.
      cloneInputAst: false
    };
    const sourceAst = isTypeScriptSource(filename) || isTSXSource(filename) || !options.hermesParser ? (0, _babelCore().parseSync)(src, babelConfig) : require('hermes-parser').parse(src, {
      babel: true,
      sourceType: babelConfig.sourceType
    });
    const result = (0, _babelCore().transformFromAstSync)(sourceAst, src, babelConfig);

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