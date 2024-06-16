import { ConfigError } from './Errors';

export function serializeAndEvaluate(val: any): any {
  if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
    return val;
  } else if (typeof val === 'function') {
    // TODO: Bacon: Should we support async methods?
    return val();
  } else if (Array.isArray(val)) {
    return val.map(serializeAndEvaluate);
  } else if (typeof val === 'object') {
    const output: { [key: string]: any } = {};
    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        output[property] = serializeAndEvaluate(val[property]);
      }
    }
    return output;
  }
  // symbol
  throw new ConfigError(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}

export function serializeSkippingMods(val: any): any {
  if (typeof val === 'object' && !Array.isArray(val)) {
    const output: { [key: string]: any } = {};
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

function serializeAndEvaluatePlugin(val: any): any {
  if (['undefined', 'string', 'boolean', 'number', 'bigint'].includes(typeof val)) {
    return val;
  } else if (typeof val === 'function') {
    return val.name || 'withAnonymous';
  } else if (Array.isArray(val)) {
    return val.map(serializeAndEvaluatePlugin);
  } else if (typeof val === 'object') {
    const output: { [key: string]: any } = {};
    for (const property in val) {
      if (val.hasOwnProperty(property)) {
        output[property] = serializeAndEvaluatePlugin(val[property]);
      }
    }
    return output;
  }
  // symbol
  throw new ConfigError(`Expo config doesn't support \`Symbols\`: ${val}`, 'INVALID_CONFIG');
}

export function serializeAfterStaticPlugins(val: any): any {
  if (typeof val === 'object' && !Array.isArray(val)) {
    const output: { [key: string]: any } = {};
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
