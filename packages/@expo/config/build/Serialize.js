"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeAfterStaticPlugins = serializeAfterStaticPlugins;
exports.serializeAndEvaluate = serializeAndEvaluate;
exports.serializeSkippingMods = serializeSkippingMods;

function _Errors() {
  const data = require("./Errors");

  _Errors = function () {
    return data;
  };

  return data;
}

function serializeAndEvaluate(val) {
  if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
    return val;
  } else if (typeof val === 'function') {
    // TODO: Bacon: Should we support async methods?
    return val();
  } else if (Array.isArray(val)) {
    return val.map(serializeAndEvaluate);
  } else if (typeof val === 'object') {
    const output = {};

    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        output[property] = serializeAndEvaluate(val[property]);
      }
    }

    return output;
  } // symbol


  throw new (_Errors().ConfigError)(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}

function serializeSkippingMods(val) {
  if (typeof val === 'object' && !Array.isArray(val)) {
    const output = {};

    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        if (property === 'mods' || property === 'plugins') {
          // Don't serialize mods or plugins
          output[property] = val[property];
        } else {
          output[property] = serializeAndEvaluate(val[property]);
        }
      }
    }

    return output;
  }

  return serializeAndEvaluate(val);
}

function serializeAndEvaluatePlugin(val) {
  if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
    return val;
  } else if (typeof val === 'function') {
    var _val$name;

    return (_val$name = val.name) !== null && _val$name !== void 0 ? _val$name : 'withAnonymous';
  } else if (Array.isArray(val)) {
    return val.map(serializeAndEvaluatePlugin);
  } else if (typeof val === 'object') {
    const output = {};

    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        output[property] = serializeAndEvaluatePlugin(val[property]);
      }
    }

    return output;
  } // symbol


  throw new (_Errors().ConfigError)(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}

function serializeAfterStaticPlugins(val) {
  if (typeof val === 'object' && !Array.isArray(val)) {
    const output = {};

    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        if (property === 'mods') {
          // Don't serialize mods
          output[property] = val[property];
        } else if (property === 'plugins' && Array.isArray(val[property])) {
          // Serialize the mods by removing any config plugins
          output[property] = val[property].map(serializeAndEvaluatePlugin);
        } else {
          output[property] = serializeAndEvaluate(val[property]);
        }
      }
    }

    return output;
  }

  return serializeAndEvaluate(val);
}
//# sourceMappingURL=Serialize.js.map