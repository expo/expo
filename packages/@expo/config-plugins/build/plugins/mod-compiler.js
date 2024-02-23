"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compileModsAsync = compileModsAsync;
exports.evalModsAsync = evalModsAsync;
exports.sortMods = sortMods;
exports.withDefaultBaseMods = withDefaultBaseMods;
exports.withIntrospectionBaseMods = withIntrospectionBaseMods;
function _debug() {
  const data = _interopRequireDefault(require("debug"));
  _debug = function () {
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
function _createBaseMod() {
  const data = require("./createBaseMod");
  _createBaseMod = function () {
    return data;
  };
  return data;
}
function _withAndroidBaseMods() {
  const data = require("./withAndroidBaseMods");
  _withAndroidBaseMods = function () {
    return data;
  };
  return data;
}
function _withIosBaseMods() {
  const data = require("./withIosBaseMods");
  _withIosBaseMods = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("../ios/utils/Xcodeproj");
  _Xcodeproj = function () {
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
function Warnings() {
  const data = _interopRequireWildcard(require("../utils/warnings"));
  Warnings = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug().default)('expo:config-plugins:mod-compiler');
function withDefaultBaseMods(config, props = {}) {
  config = (0, _withIosBaseMods().withIosBaseMods)(config, props);
  config = (0, _withAndroidBaseMods().withAndroidBaseMods)(config, props);
  return config;
}

/**
 * Get a prebuild config that safely evaluates mods without persisting any changes to the file system.
 * Currently this only supports infoPlist, entitlements, androidManifest, strings, gradleProperties, and expoPlist mods.
 * This plugin should be evaluated directly:
 */
function withIntrospectionBaseMods(config, props = {}) {
  config = (0, _withIosBaseMods().withIosBaseMods)(config, {
    saveToInternal: true,
    // This writing optimization can be skipped since we never write in introspection mode.
    // Including empty mods will ensure that all mods get introspected.
    skipEmptyMod: false,
    ...props
  });
  config = (0, _withAndroidBaseMods().withAndroidBaseMods)(config, {
    saveToInternal: true,
    skipEmptyMod: false,
    ...props
  });
  if (config.mods) {
    // Remove all mods that don't have an introspection base mod, for instance `dangerous` mods.
    for (const platform of Object.keys(config.mods)) {
      // const platformPreserve = preserve[platform];
      for (const key of Object.keys(config.mods[platform] || {})) {
        // @ts-ignore
        if (!config.mods[platform]?.[key]?.isIntrospective) {
          debug(`removing non-idempotent mod: ${platform}.${key}`);
          // @ts-ignore
          delete config.mods[platform]?.[key];
        }
      }
    }
  }
  return config;
}

/**
 *
 * @param projectRoot
 * @param config
 */
async function compileModsAsync(config, props) {
  if (props.introspect === true) {
    config = withIntrospectionBaseMods(config);
  } else {
    config = withDefaultBaseMods(config);
  }
  return await evalModsAsync(config, props);
}
function sortMods(commands, precedences) {
  const seen = new Set();
  const dedupedCommands = commands.filter(([key]) => {
    const duplicate = seen.has(key);
    seen.add(key);
    return !duplicate;
  });
  return dedupedCommands.sort(([keyA], [keyB]) => {
    const precedenceA = precedences[keyA] || 0;
    const precedenceB = precedences[keyB] || 0;
    return precedenceA - precedenceB;
  });
}
function getRawClone({
  mods,
  ...config
}) {
  // Configs should be fully serializable, so we can clone them without worrying about
  // the mods.
  return Object.freeze(JSON.parse(JSON.stringify(config)));
}
const precedences = {
  ios: {
    // dangerous runs first
    dangerous: -2,
    // run the XcodeProject mod second because many plugins attempt to read from it.
    xcodeproj: -1,
    // put the finalized mod at the last
    finalized: 1
  }
};
/**
 * A generic plugin compiler.
 *
 * @param config
 */
async function evalModsAsync(config, {
  projectRoot,
  introspect,
  platforms,
  assertMissingModProviders,
  ignoreExistingNativeFiles = false
}) {
  const modRawConfig = getRawClone(config);
  for (const [platformName, platform] of Object.entries(config.mods ?? {})) {
    if (platforms && !platforms.includes(platformName)) {
      debug(`skip platform: ${platformName}`);
      continue;
    }
    let entries = Object.entries(platform);
    if (entries.length) {
      // Move dangerous item to the first position and finalized item to the last position if it exists.
      // This ensures that all dangerous code runs first and finalized applies last.
      entries = sortMods(entries, precedences[platformName] ?? {
        dangerous: -1,
        finalized: 1
      });
      debug(`run in order: ${entries.map(([name]) => name).join(', ')}`);
      const platformProjectRoot = _path().default.join(projectRoot, platformName);
      const projectName = platformName === 'ios' ? (0, _Xcodeproj().getHackyProjectName)(projectRoot, config) : undefined;
      for (const [modName, mod] of entries) {
        const modRequest = {
          projectRoot,
          projectName,
          platformProjectRoot,
          platform: platformName,
          modName,
          introspect: !!introspect,
          ignoreExistingNativeFiles
        };
        if (!mod.isProvider) {
          // In strict mode, throw an error.
          const errorMessage = `Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods`;
          if (assertMissingModProviders !== false) {
            throw new (_errors().PluginError)(errorMessage, 'MISSING_PROVIDER');
          } else {
            Warnings().addWarningForPlatform(platformName, `${platformName}.${modName}`, `Skipping: Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods. This may be due to an outdated version of Expo CLI.`);
            // In loose mode, just skip the mod entirely.
            continue;
          }
        }
        const results = await mod({
          ...config,
          modResults: null,
          modRequest,
          modRawConfig
        });

        // Sanity check to help locate non compliant mods.
        config = (0, _createBaseMod().assertModResults)(results, platformName, modName);
        // @ts-ignore: `modResults` is added for modifications
        delete config.modResults;
        // @ts-ignore: `modRequest` is added for modifications
        delete config.modRequest;
        // @ts-ignore: `modRawConfig` is added for modifications
        delete config.modRawConfig;
      }
    }
  }
  return config;
}
//# sourceMappingURL=mod-compiler.js.map