"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertModResults = assertModResults;
exports.createBaseMod = createBaseMod;
exports.createPlatformBaseMod = createPlatformBaseMod;
exports.provider = provider;
exports.withGeneratedBaseMods = withGeneratedBaseMods;

function _debug() {
  const data = _interopRequireDefault(require("debug"));

  _debug = function () {
    return data;
  };

  return data;
}

function _withMod() {
  const data = require("./withMod");

  _withMod = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug().default)('expo:config-plugins:base-mods');

function createBaseMod({
  methodName,
  platform,
  modName,
  getFilePath,
  read,
  write,
  isIntrospective
}) {
  const withUnknown = (config, _props) => {
    var _props$skipEmptyMod, _props$saveToInternal;

    const props = _props || {};
    return (0, _withMod().withBaseMod)(config, {
      platform,
      mod: modName,
      skipEmptyMod: (_props$skipEmptyMod = props.skipEmptyMod) !== null && _props$skipEmptyMod !== void 0 ? _props$skipEmptyMod : true,
      saveToInternal: (_props$saveToInternal = props.saveToInternal) !== null && _props$saveToInternal !== void 0 ? _props$saveToInternal : false,
      isProvider: true,
      isIntrospective,

      async action({
        modRequest: {
          nextMod,
          ...modRequest
        },
        ...config
      }) {
        try {
          let results = { ...config,
            modRequest
          };
          const filePath = await getFilePath(results, props);
          debug(`mods.${platform}.${modName}: file path: ${filePath || '[skipped]'}`);
          const modResults = await read(filePath, results, props);
          results = await nextMod({ ...results,
            modResults,
            modRequest
          });
          assertModResults(results, modRequest.platform, modRequest.modName);
          await write(filePath, results, props);
          return results;
        } catch (error) {
          error.message = `[${platform}.${modName}]: ${methodName}: ${error.message}`;
          throw error;
        }
      }

    });
  };

  if (methodName) {
    Object.defineProperty(withUnknown, 'name', {
      value: methodName
    });
  }

  return withUnknown;
}

function assertModResults(results, platformName, modName) {
  // If the results came from a mod, they'd be in the form of [config, data].
  // Ensure the results are an array and omit the data since it should've been written by a data provider plugin.
  const ensuredResults = results; // Sanity check to help locate non compliant mods.

  if (!ensuredResults || typeof ensuredResults !== 'object' || !(ensuredResults !== null && ensuredResults !== void 0 && ensuredResults.mods)) {
    throw new Error(`Mod \`mods.${platformName}.${modName}\` evaluated to an object that is not a valid project config. Instead got: ${JSON.stringify(ensuredResults)}`);
  }

  return ensuredResults;
}

function upperFirst(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function createPlatformBaseMod({
  modName,
  ...props
}) {
  // Generate the function name to ensure it's uniform and also to improve stack traces.
  const methodName = `with${upperFirst(props.platform)}${upperFirst(modName)}BaseMod`;
  return createBaseMod({
    methodName,
    modName,
    ...props
  });
}
/** A TS wrapper for creating provides */


function provider(props) {
  return props;
}
/** Plugin to create and append base mods from file providers */


function withGeneratedBaseMods(config, {
  platform,
  providers,
  ...props
}) {
  return Object.entries(providers).reduce((config, [modName, value]) => {
    const baseMod = createPlatformBaseMod({
      platform,
      modName,
      ...value
    });
    return baseMod(config, props);
  }, config);
}
//# sourceMappingURL=createBaseMod.js.map