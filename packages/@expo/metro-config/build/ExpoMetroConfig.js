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
function _config() {
  const data = require("@expo/config");
  _config = function () {
    return data;
  };
  return data;
}
function _paths() {
  const data = require("@expo/config/paths");
  _paths = function () {
    return data;
  };
  return data;
}
function runtimeEnv() {
  const data = _interopRequireWildcard(require("@expo/env"));
  runtimeEnv = function () {
    return data;
  };
  return data;
}
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
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
function _metroCache() {
  const data = require("metro-cache");
  _metroCache = function () {
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
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
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
function _env2() {
  const data = require("./env");
  _env2 = function () {
    return data;
  };
  return data;
}
function _fileStore() {
  const data = require("./file-store");
  _fileStore = function () {
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
function _withExpoSerializers() {
  const data = require("./serializer/withExpoSerializers");
  _withExpoSerializers = function () {
    return data;
  };
  return data;
}
function _postcss() {
  const data = require("./transform-worker/postcss");
  _postcss = function () {
    return data;
  };
  return data;
}
function _metroConfig2() {
  const data = require("./traveling/metro-config");
  _metroConfig2 = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// Copyright 2023-present 650 Industries (Expo). All rights reserved.

const debug = require('debug')('expo:metro:config');
function getAssetPlugins(projectRoot) {
  const hashAssetFilesPath = _resolveFrom().default.silent(projectRoot, 'expo-asset/tools/hashAssetFiles');
  if (!hashAssetFilesPath) {
    throw new Error(`The required package \`expo-asset\` cannot be found`);
  }
  return [hashAssetFilesPath];
}
let hasWarnedAboutExotic = false;

// Patch Metro's graph to support always parsing certain modules. This enables
// things like Tailwind CSS which update based on their own heuristics.
function patchMetroGraphToSupportUncachedModules() {
  const {
    Graph
  } = require('metro/src/DeltaBundler/Graph');
  const original_traverseDependencies = Graph.prototype.traverseDependencies;
  if (!original_traverseDependencies.__patched) {
    original_traverseDependencies.__patched = true;
    Graph.prototype.traverseDependencies = function (paths, options) {
      this.dependencies.forEach(dependency => {
        // Find any dependencies that have been marked as `skipCache` and ensure they are invalidated.
        // `skipCache` is set when a CSS module is found by PostCSS.
        if (dependency.output.find(file => {
          var _file$data$css;
          return (_file$data$css = file.data.css) === null || _file$data$css === void 0 ? void 0 : _file$data$css.skipCache;
        }) && !paths.includes(dependency.path)) {
          // Ensure we invalidate the `unstable_transformResultKey` (input hash) so the module isn't removed in
          // the Graph._processModule method.
          dependency.unstable_transformResultKey = dependency.unstable_transformResultKey + '.';

          // Add the path to the list of modified paths so it gets run through the transformer again,
          // this will ensure it is passed to PostCSS -> Tailwind.
          paths.push(dependency.path);
        }
      });
      // Invoke the original method with the new paths to ensure the standard behavior is preserved.
      return original_traverseDependencies.call(this, paths, options);
    };
    // Ensure we don't patch the method twice.
    Graph.prototype.traverseDependencies.__patched = true;
  }
}
function getDefaultConfig(projectRoot, {
  mode,
  isCSSEnabled = true,
  unstable_beforeAssetSerializationPlugins
} = {}) {
  const {
    getDefaultConfig: getDefaultMetroConfig,
    mergeConfig
  } = (0, _metroConfig2().importMetroConfig)(projectRoot);
  if (isCSSEnabled) {
    patchMetroGraphToSupportUncachedModules();
  }
  const isExotic = mode === 'exotic' || _env2().env.EXPO_USE_EXOTIC;
  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(_chalk().default.gray(`\u203A Feature ${_chalk().default.bold`EXPO_USE_EXOTIC`} is no longer supported.`));
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
    isModern: true
  };
  const sourceExts = (0, _paths().getBareExtensions)([], sourceExtsConfig);

  // Add support for cjs (without platform extensions).
  sourceExts.push('cjs');
  const reanimatedVersion = getPkgVersion(projectRoot, 'react-native-reanimated');
  let sassVersion = null;
  if (isCSSEnabled) {
    sassVersion = getPkgVersion(projectRoot, 'sass');
    // Enable SCSS by default so we can provide a better error message
    // when sass isn't installed.
    sourceExts.push('scss', 'sass', 'css');
  }
  const envFiles = runtimeEnv().getFiles(process.env.NODE_ENV, {
    silent: true
  });
  const pkg = (0, _config().getPackageJson)(projectRoot);
  const watchFolders = (0, _getWatchFolders().getWatchFolders)(projectRoot);
  const nodeModulesPaths = (0, _getModulesPaths().getModulesPaths)(projectRoot);
  if (_env2().env.EXPO_DEBUG) {
    console.log();
    console.log(`Expo Metro config:`);
    try {
      console.log(`- Version: ${require('../package.json').version}`);
    } catch {}
    console.log(`- Extensions: ${sourceExts.join(', ')}`);
    console.log(`- React Native: ${reactNativePath}`);
    console.log(`- Watch Folders: ${watchFolders.join(', ')}`);
    console.log(`- Node Module Paths: ${nodeModulesPaths.join(', ')}`);
    console.log(`- Env Files: ${envFiles}`);
    console.log(`- Sass: ${sassVersion}`);
    console.log(`- Reanimated: ${reanimatedVersion}`);
    console.log();
  }
  const {
    // Remove the default reporter which metro always resolves to be the react-native-community/cli reporter.
    // This prints a giant React logo which is less accessible to users on smaller terminals.
    reporter,
    ...metroDefaultValues
  } = getDefaultMetroConfig.getDefaultValues(projectRoot);
  const cacheStore = new (_fileStore().FileStore)({
    root: _path().default.join(_os().default.tmpdir(), 'metro-cache')
  });

  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  const metroConfig = mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      unstable_conditionsByPlatform: {
        ios: ['react-native'],
        android: ['react-native'],
        // This is removed for server platforms.
        web: ['browser']
      },
      unstable_conditionNames: ['require', 'import'],
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['ios', 'android'],
      assetExts: metroDefaultValues.resolver.assetExts.concat(
      // Add default support for `expo-image` file types.
      ['heic', 'avif']).filter(assetExt => !sourceExts.includes(assetExt)),
      sourceExts,
      nodeModulesPaths
    },
    cacheStores: [cacheStore],
    watcher: {
      // strip starting dot from env files
      additionalExts: envFiles.map(file => file.replace(/^\./, ''))
    },
    serializer: {
      getModulesRunBeforeMainModule: () => {
        const preModules = [
        // MUST be first
        require.resolve(_path().default.join(reactNativePath, 'Libraries/Core/InitializeCore'))];
        const stdRuntime = _resolveFrom().default.silent(projectRoot, 'expo/build/winter');
        if (stdRuntime) {
          preModules.push(stdRuntime);
        }

        // We need to shift this to be the first module so web Fast Refresh works as expected.
        // This will only be applied if the module is installed and imported somewhere in the bundle already.
        const metroRuntime = _resolveFrom().default.silent(projectRoot, '@expo/metro-runtime');
        if (metroRuntime) {
          preModules.push(metroRuntime);
        }
        return preModules;
      },
      getPolyfills: () => require('@react-native/js-polyfills')()
    },
    server: {
      rewriteRequestUrl: (0, _rewriteRequestUrl().getRewriteRequestUrl)(projectRoot),
      port: Number(_env2().env.RCT_METRO_PORT) || 8081,
      // NOTE(EvanBacon): Moves the server root down to the monorepo root.
      // This enables proper monorepo support for web.
      unstable_serverRoot: (0, _getModulesPaths().getServerRoot)(projectRoot)
    },
    symbolicator: {
      customizeFrame: (0, _customizeFrame().getDefaultCustomizeFrame)()
    },
    transformerPath: require.resolve('./transform-worker/transform-worker'),
    transformer: {
      // Custom: These are passed to `getCacheKey` and ensure invalidation when the version changes.
      // @ts-expect-error: not on type.
      postcssHash: (0, _postcss().getPostcssConfigHash)(projectRoot),
      browserslistHash: pkg.browserslist ? (0, _metroCache().stableHash)(JSON.stringify(pkg.browserslist)).toString('hex') : null,
      sassVersion,
      // Ensure invalidation when the version changes due to the Babel plugin.
      reanimatedVersion,
      // `require.context` support
      unstable_allowRequireContext: true,
      allowOptionalDependencies: true,
      babelTransformerPath: require.resolve('./babel-transformer'),
      // See: https://github.com/facebook/react-native/blob/v0.73.0/packages/metro-config/index.js#L72-L74
      asyncRequireModulePath: (0, _resolveFrom().default)(reactNativePath, metroDefaultValues.transformer.asyncRequireModulePath),
      assetRegistryPath: '@react-native/assets-registry/registry',
      assetPlugins: getAssetPlugins(projectRoot),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false
        }
      })
    }
  });
  return (0, _withExpoSerializers().withExpoSerializers)(metroConfig, {
    unstable_beforeAssetSerializationPlugins
  });
}

// re-export for use in config files.

// re-export for legacy cases.
const EXPO_DEBUG = _env2().env.EXPO_DEBUG;
exports.EXPO_DEBUG = EXPO_DEBUG;
function getPkgVersion(projectRoot, pkgName) {
  const targetPkg = _resolveFrom().default.silent(projectRoot, pkgName);
  if (!targetPkg) return null;
  const targetPkgJson = findUpPackageJson(targetPkg);
  if (!targetPkgJson) return null;
  const pkg = _jsonFile().default.read(targetPkgJson);
  debug(`${pkgName} package.json:`, targetPkgJson);
  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }
  return null;
}
function findUpPackageJson(cwd) {
  if (['.', _path().default.sep].includes(cwd)) return null;
  const found = _resolveFrom().default.silent(cwd, './package.json');
  if (found) {
    return found;
  }
  return findUpPackageJson(_path().default.dirname(cwd));
}
//# sourceMappingURL=ExpoMetroConfig.js.map