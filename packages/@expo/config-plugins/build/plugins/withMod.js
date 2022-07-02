"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withBaseMod = withBaseMod;
exports.withMod = withMod;

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

function _errors() {
  const data = require("../utils/errors");

  _errors = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);

/**
 * Plugin to intercept execution of a given `mod` with the given `action`.
 * If an action was already set on the given `config` config for `mod`, then it
 * will be provided to the `action` as `nextMod` when it's evaluated, otherwise
 * `nextMod` will be an identity function.
 *
 * @param config exported config
 * @param platform platform to target (ios or android)
 * @param mod name of the platform function to intercept
 * @param skipEmptyMod should skip running the action if there is no existing mod to intercept
 * @param saveToInternal should save the results to `_internal.modResults`, only enable this when the results are pure JSON.
 * @param isProvider should provide data up to the other mods.
 * @param action method to run on the mod when the config is compiled
 */
function withBaseMod(config, {
  platform,
  mod,
  action,
  skipEmptyMod,
  isProvider,
  isIntrospective,
  saveToInternal
}) {
  var _config$_internal$isD, _config$_internal;

  if (!config.mods) {
    config.mods = {};
  }

  if (!config.mods[platform]) {
    config.mods[platform] = {};
  }

  let interceptedMod = config.mods[platform][mod]; // No existing mod to intercept

  if (!interceptedMod) {
    if (skipEmptyMod) {
      // Skip running the action
      return config;
    } // Use a noop mod and continue


    const noopMod = config => config;

    interceptedMod = noopMod;
  } // Create a stack trace for debugging ahead of time


  let debugTrace = ''; // Use the possibly user defined value. Otherwise fallback to the env variable.
  // We support the env variable because user mods won't have _internal defined in time.

  const isDebug = (_config$_internal$isD = (_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : _config$_internal.isDebug) !== null && _config$_internal$isD !== void 0 ? _config$_internal$isD : EXPO_DEBUG;

  if (isDebug) {
    // Get a stack trace via the Error API
    const stack = new Error().stack; // Format the stack trace to create the debug log

    debugTrace = getDebugPluginStackFromStackTrace(stack);

    const modStack = _chalk().default.bold(`${platform}.${mod}`);

    debugTrace = `${modStack}: ${debugTrace}`;
  } // Prevent adding multiple providers to a mod.
  // Base mods that provide files ignore any incoming modResults and therefore shouldn't have provider mods as parents.


  if (interceptedMod.isProvider) {
    if (isProvider) {
      throw new (_errors().PluginError)(`Cannot set provider mod for "${platform}.${mod}" because another is already being used.`, 'CONFLICTING_PROVIDER');
    } else {
      throw new (_errors().PluginError)(`Cannot add mod to "${platform}.${mod}" because the provider has already been added. Provider must be the last mod added.`, 'INVALID_MOD_ORDER');
    }
  }

  async function interceptingMod({
    modRequest,
    ...config
  }) {
    if (isDebug) {
      // In debug mod, log the plugin stack in the order which they were invoked
      console.log(debugTrace);
    }

    const results = await action({ ...config,
      modRequest: { ...modRequest,
        nextMod: interceptedMod
      }
    });

    if (saveToInternal) {
      saveToInternalObject(results, platform, mod, results.modResults);
    }

    return results;
  } // Ensure this base mod is registered as the provider.


  interceptingMod.isProvider = isProvider;

  if (isIntrospective) {
    // Register the mode as idempotent so introspection doesn't remove it.
    interceptingMod.isIntrospective = isIntrospective;
  }

  config.mods[platform][mod] = interceptingMod;
  return config;
}

function saveToInternalObject(config, platformName, modName, results) {
  if (!config._internal) config._internal = {};
  if (!config._internal.modResults) config._internal.modResults = {};
  if (!config._internal.modResults[platformName]) config._internal.modResults[platformName] = {};
  config._internal.modResults[platformName][modName] = results;
}

function getDebugPluginStackFromStackTrace(stacktrace) {
  if (!stacktrace) {
    return '';
  }

  const treeStackLines = [];

  for (const line of stacktrace.split('\n')) {
    const [first, second] = line.trim().split(' ');

    if (first === 'at') {
      treeStackLines.push(second);
    }
  }

  const plugins = treeStackLines.map(first => {
    var _ref, _first$match$1$trim, _first$match, _first$match$, _first$match2, _first$match2$;

    // Match the first part of the stack trace against the plugin naming convention
    // "with" followed by a capital letter.
    return (_ref = (_first$match$1$trim = first === null || first === void 0 ? void 0 : (_first$match = first.match(/^(\bwith[A-Z].*?\b)/)) === null || _first$match === void 0 ? void 0 : (_first$match$ = _first$match[1]) === null || _first$match$ === void 0 ? void 0 : _first$match$.trim()) !== null && _first$match$1$trim !== void 0 ? _first$match$1$trim : first === null || first === void 0 ? void 0 : (_first$match2 = first.match(/\.(\bwith[A-Z].*?\b)/)) === null || _first$match2 === void 0 ? void 0 : (_first$match2$ = _first$match2[1]) === null || _first$match2$ === void 0 ? void 0 : _first$match2$.trim()) !== null && _ref !== void 0 ? _ref : null;
  }).filter(Boolean).filter(plugin => {
    // redundant as all debug logs are captured in withBaseMod
    return !['withMod', 'withBaseMod', 'withExtendedMod'].includes(plugin);
  });
  const commonPlugins = ['withPlugins', 'withRunOnce', 'withStaticPlugin'];
  return plugins.reverse().map((pluginName, index) => {
    // Base mods indicate a logical section.
    if (pluginName.includes('BaseMod')) {
      pluginName = _chalk().default.bold(pluginName);
    } // highlight dangerous mods


    if (pluginName.toLowerCase().includes('dangerous')) {
      pluginName = _chalk().default.red(pluginName);
    }

    if (index === 0) {
      return _chalk().default.blue(pluginName);
    } else if (commonPlugins.includes(pluginName)) {
      // Common mod names often clutter up the logs, dim them out
      return _chalk().default.dim(pluginName);
    }

    return pluginName;
  }) // Join the results:
  // withAndroidExpoPlugins ➜ withPlugins ➜ withIcons ➜ withDangerousMod ➜ withMod
  .join(' ➜ ');
}
/**
 * Plugin to extend a mod function in the plugins config.
 *
 * @param config exported config
 * @param platform platform to target (ios or android)
 * @param mod name of the platform function to extend
 * @param action method to run on the mod when the config is compiled
 */


function withMod(config, {
  platform,
  mod,
  action
}) {
  return withBaseMod(config, {
    platform,
    mod,
    isProvider: false,

    async action({
      modRequest: {
        nextMod,
        ...modRequest
      },
      modResults,
      ...config
    }) {
      const results = await action({
        modRequest,
        modResults: modResults,
        ...config
      });
      return nextMod(results);
    }

  });
}
//# sourceMappingURL=withMod.js.map