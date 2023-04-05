"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EXPO_DEBUG = void 0;
Object.defineProperty(exports, "INTERNAL_CALLSITES_REGEX", {
  enumerable: true,
  get: function () {
    return _customizeFrame().INTERNAL_CALLSITES_REGEX;
  }
});
Object.defineProperty(exports, "MetroConfig", {
  enumerable: true,
  get: function () {
    return _metroConfig().ConfigT;
  }
});
exports.getDefaultConfig = getDefaultConfig;
exports.loadAsync = loadAsync;
function _paths() {
  const data = require("@expo/config/paths");
  _paths = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _metroConfig() {
  const data = require("metro-config");
  _metroConfig = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _customizeFrame() {
  const data = require("./customizeFrame");
  _customizeFrame = function () {
    return data;
  };
  return data;
}
function _env() {
  const data = require("./env");
  _env = function () {
    return data;
  };
  return data;
}
function _getModulesPaths() {
  const data = require("./getModulesPaths");
  _getModulesPaths = function () {
    return data;
  };
  return data;
}
function _getWatchFolders() {
  const data = require("./getWatchFolders");
  _getWatchFolders = function () {
    return data;
  };
  return data;
}
function _rewriteRequestUrl() {
  const data = require("./rewriteRequestUrl");
  _rewriteRequestUrl = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Copyright 2023-present 650 Industries (Expo). All rights reserved.

function getProjectBabelConfigFile(projectRoot) {
  return _resolveFrom().default.silent(projectRoot, './babel.config.js') || _resolveFrom().default.silent(projectRoot, './.babelrc') || _resolveFrom().default.silent(projectRoot, './.babelrc.js');
}
function getAssetPlugins(projectRoot) {
  const hashAssetFilesPath = _resolveFrom().default.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');
  if (!hashAssetFilesPath) {
    throw new Error(`The required package \`expo-asset\` cannot be found`);
  }
  return [hashAssetFilesPath];
}
let hasWarnedAboutExotic = false;
function getDefaultConfig(projectRoot, options = {}) {
  const isExotic = options.mode === 'exotic' || _env().env.EXPO_USE_EXOTIC;
  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(_chalk().default.gray(`\u203A Unstable feature ${_chalk().default.bold`EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`));
  }
  const reactNativePath = _path().default.dirname((0, _resolveFrom().default)(projectRoot, 'react-native/package.json'));
  try {
    // Set the `EXPO_METRO_CACHE_KEY_VERSION` variable for use in the custom babel transformer.
    // This hack is used because there doesn't appear to be anyway to resolve
    // `babel-preset-fbjs` relative to the project root later (in `metro-expo-babel-transformer`).
    const babelPresetFbjsPath = (0, _resolveFrom().default)(projectRoot, 'babel-preset-fbjs/package.json');
    process.env.EXPO_METRO_CACHE_KEY_VERSION = String(require(babelPresetFbjsPath).version);
  } catch {
    // noop -- falls back to a hardcoded value.
  }
  const sourceExtsConfig = {
    isTS: true,
    isReact: true,
    isModern: false
  };
  const sourceExts = (0, _paths().getBareExtensions)([], sourceExtsConfig);
  if (options.isCSSEnabled) {
    sourceExts.push('css');
  }
  if (isExotic) {
    // Add support for cjs (without platform extensions).
    sourceExts.push('cjs');
  }
  const babelConfigPath = getProjectBabelConfigFile(projectRoot);
  const isCustomBabelConfigDefined = !!babelConfigPath;
  const resolverMainFields = [];

  // Disable `react-native` in exotic mode, since library authors
  // use it to ship raw application code to the project.
  if (!isExotic) {
    resolverMainFields.push('react-native');
  }
  resolverMainFields.push('browser', 'main');
  const watchFolders = (0, _getWatchFolders().getWatchFolders)(projectRoot);
  // TODO: nodeModulesPaths does not work with the new Node.js package.json exports API, this causes packages like uuid to fail. Disabling for now.
  const nodeModulesPaths = (0, _getModulesPaths().getModulesPaths)(projectRoot);
  if (_env().env.EXPO_DEBUG) {
    console.log();
    console.log(`Expo Metro config:`);
    try {
      console.log(`- Version: ${require('../package.json').version}`);
    } catch {}
    console.log(`- Extensions: ${sourceExts.join(', ')}`);
    console.log(`- React Native: ${reactNativePath}`);
    console.log(`- Babel config: ${babelConfigPath || 'babel-preset-expo (default)'}`);
    console.log(`- Resolver Fields: ${resolverMainFields.join(', ')}`);
    console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
    console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
    console.log(`- Exotic: ${isExotic}`);
    console.log();
  }
  const {
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter,
    ...metroDefaultValues
  } = _metroConfig().getDefaultConfig.getDefaultValues(projectRoot);

  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  return (0, _metroConfig().mergeConfig)(metroDefaultValues, {
    watchFolders,
    resolver: {
      resolverMainFields,
      platforms: ['ios', 'android'],
      assetExts: metroDefaultValues.resolver.assetExts.concat(
      // Add default support for `expo-image` file types.
      ['heic', 'avif']).filter(assetExt => !sourceExts.includes(assetExt)),
      sourceExts,
      nodeModulesPaths
    },
    serializer: {
      getModulesRunBeforeMainModule: () => [require.resolve(_path().default.join(reactNativePath, 'Libraries/Core/InitializeCore'))
      // TODO: Bacon: load Expo side-effects
      ],

      getPolyfills: () => require(_path().default.join(reactNativePath, 'rn-get-polyfills'))()
    },
    server: {
      rewriteRequestUrl: (0, _rewriteRequestUrl().getRewriteRequestUrl)(projectRoot),
      port: Number(_env().env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      unstable_serverRoot: (0, _getModulesPaths().getServerRoot)(projectRoot)
    },
    symbolicator: {
      customizeFrame: (0, _customizeFrame().getDefaultCustomizeFrame)()
    },
    transformerPath: options.isCSSEnabled ?
    // Custom worker that adds CSS support for Metro web.
    require.resolve('./transform-worker/transform-worker') : undefined,
    transformer: {
      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: isExotic ? require.resolve('./transformer/metro-expo-exotic-babel-transformer') : isCustomBabelConfigDefined ?
      // If the user defined a babel config file in their project,
      // then use the default transformer.
      // Try to use the project copy before falling back on the global version
      _resolveFrom().default.silent(projectRoot, 'metro-react-native-babel-transformer') :
      // Otherwise, use a custom transformer that uses `babel-preset-expo` by default for projects.
      require.resolve('./transformer/metro-expo-babel-transformer'),
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
      assetPlugins: getAssetPlugins(projectRoot)
    }
  });
}
async function loadAsync(projectRoot, {
  reporter,
  ...metroOptions
} = {}) {
  let defaultConfig = getDefaultConfig(projectRoot);
  if (reporter) {
    defaultConfig = {
      ...defaultConfig,
      reporter
    };
  }
  return await (0, _metroConfig().loadConfig)({
    cwd: projectRoot,
    projectRoot,
    ...metroOptions
  }, defaultConfig);
}

// re-export for use in config files.

// re-export for legacy cases.
const EXPO_DEBUG = _env().env.EXPO_DEBUG;
exports.EXPO_DEBUG = EXPO_DEBUG;
//# sourceMappingURL=ExpoMetroConfig.js.map