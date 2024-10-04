"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.INTERNAL_CALLSITES_REGEX = exports.EXPO_DEBUG = void 0;
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
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
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
function _url() {
  const data = require("url");
  _url = function () {
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
function _importMetroFromProject() {
  const data = require("./importMetroFromProject");
  _importMetroFromProject = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Copyright 2021-present 650 Industries (Expo). All rights reserved.

const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);
exports.EXPO_DEBUG = EXPO_DEBUG;
const EXPO_USE_EXOTIC = (0, _getenv().boolish)('EXPO_USE_EXOTIC', false);

// Import only the types here, the values will be imported from the project, at runtime.
const INTERNAL_CALLSITES_REGEX = new RegExp(['/Libraries/Renderer/implementations/.+\\.js$', '/Libraries/BatchedBridge/MessageQueue\\.js$', '/Libraries/YellowBox/.+\\.js$', '/Libraries/LogBox/.+\\.js$', '/Libraries/Core/Timers/.+\\.js$', 'node_modules/react-devtools-core/.+\\.js$', 'node_modules/react-refresh/.+\\.js$', 'node_modules/scheduler/.+\\.js$',
// Metro replaces `require()` with a different method,
// we want to omit this method from the stack trace.
// This is akin to most React tooling.
'/metro/.*/polyfills/require.js$',
// Hide frames related to a fast refresh.
'/metro/.*/lib/bundle-modules/.+\\.js$', 'node_modules/react-native/Libraries/Utilities/HMRClient.js$', 'node_modules/eventemitter3/index.js', 'node_modules/event-target-shim/dist/.+\\.js$',
// Ignore the log forwarder used in the expo package.
'/expo/build/logs/RemoteConsole.js$',
// Improve errors thrown by invariant (ex: `Invariant Violation: "main" has not been registered`).
'node_modules/invariant/.+\\.js$',
// Remove babel runtime additions
'node_modules/regenerator-runtime/.+\\.js$',
// Remove react native setImmediate ponyfill
'node_modules/promise/setimmediate/.+\\.js$',
// Babel helpers that implement language features
'node_modules/@babel/runtime/.+\\.js$',
// Hide Hermes internal bytecode
'/InternalBytecode/InternalBytecode\\.js$',
// Block native code invocations
`\\[native code\\]`,
// Hide react-dom (web)
'node_modules/react-dom/.+\\.js$'].join('|'));
exports.INTERNAL_CALLSITES_REGEX = INTERNAL_CALLSITES_REGEX;
function isUrl(value) {
  try {
    // eslint-disable-next-line no-new
    new (_url().URL)(value);
    return true;
  } catch {
    return false;
  }
}
function getProjectBabelConfigFile(projectRoot) {
  return _resolveFrom().default.silent(projectRoot, './babel.config.js') || _resolveFrom().default.silent(projectRoot, './.babelrc') || _resolveFrom().default.silent(projectRoot, './.babelrc.js');
}
function getAssetPlugins(projectRoot) {
  const assetPlugins = [];
  let hashAssetFilesPath;
  try {
    hashAssetFilesPath = (0, _resolveFrom().default)(projectRoot, 'expo-asset/tools/hashAssetFiles');
  } catch {
    // TODO: we should warn/throw an error if the user has expo-updates installed but does not
    // have hashAssetFiles available, or if the user is in managed workflow and does not have
    // hashAssetFiles available. but in a bare app w/o expo-updates, just using dev-client,
    // it is not needed
  }
  if (hashAssetFilesPath) {
    assetPlugins.push(hashAssetFilesPath);
  }
  return assetPlugins;
}
let hasWarnedAboutExotic = false;
function getDefaultConfig(projectRoot, options = {}) {
  const isExotic = options.mode === 'exotic' || EXPO_USE_EXOTIC;
  if (isExotic && !hasWarnedAboutExotic) {
    hasWarnedAboutExotic = true;
    console.log(_chalk().default.gray(`\u203A Unstable feature ${_chalk().default.bold`EXPO_USE_EXOTIC`} is enabled. Bundling may not work as expected, and is subject to breaking changes.`));
  }
  const MetroConfig = (0, _importMetroFromProject().importMetroConfigFromProject)(projectRoot);
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
  if (EXPO_DEBUG) {
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
  } = MetroConfig.getDefaultConfig.getDefaultValues(projectRoot);

  // Merge in the default config from Metro here, even though loadConfig uses it as defaults.
  // This is a convenience for getDefaultConfig use in metro.config.js, e.g. to modify assetExts.
  return MetroConfig.mergeConfig(metroDefaultValues, {
    watchFolders,
    resolver: {
      resolverMainFields,
      platforms: ['ios', 'android', 'native', 'testing'],
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
      port: Number(process.env.RCT_METRO_PORT) || 8081
    },
    symbolicator: {
      customizeFrame: frame => {
        if (frame.file && isUrl(frame.file)) {
          return {
            ...frame,
            // HACK: This prevents Metro from attempting to read the invalid file URL it sent us.
            lineNumber: null,
            column: null,
            // This prevents the invalid frame from being shown by default.
            collapse: true
          };
        }
        let collapse = Boolean(frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file));
        if (!collapse) {
          var _frame$file;
          // This represents the first frame of the stacktrace.
          // Often this looks like: `__r(0);`.
          // The URL will also be unactionable in the app and therefore not very useful to the developer.
          if (frame.column === 3 && frame.methodName === 'global code' && (_frame$file = frame.file) !== null && _frame$file !== void 0 && _frame$file.match(/^https?:\/\//g)) {
            collapse = true;
          }
        }
        return {
          ...(frame || {}),
          collapse
        };
      }
    },
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
  const MetroConfig = (0, _importMetroFromProject().importMetroConfigFromProject)(projectRoot);
  return await MetroConfig.loadConfig({
    cwd: projectRoot,
    projectRoot,
    ...metroOptions
  }, defaultConfig);
}
//# sourceMappingURL=ExpoMetroConfig.js.map