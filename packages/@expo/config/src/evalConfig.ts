import { transformSync, formatMessagesSync } from 'esbuild';
import { readFileSync } from 'fs';
import requireString from 'require-from-string';

import { AppJSONConfig, ConfigContext, ExpoConfig } from './Config.types';
import { ConfigError } from './Errors';
import { serializeSkippingMods } from './Serialize';
import { NON_STANDARD_SYMBOL } from './environment';

type RawDynamicConfig = AppJSONConfig | Partial<ExpoConfig> | null;

export type DynamicConfigResults = {
  config: RawDynamicConfig;
  exportedObjectType: string;
  mayHaveUnusedStaticConfig: boolean;
};

/**
 * Transpile and evaluate the dynamic config object.
 * This method is shared between the standard reading method in getConfig, and the headless script.
 *
 * @param options configFile path to the dynamic app.config.*, request to send to the dynamic config if it exports a function.
 * @returns the serialized and evaluated config along with the exported object type (object or function).
 */
export function evalConfig(
  configFile: string,
  request: ConfigContext | null
): DynamicConfigResults {
  const contents = readFileSync(configFile, 'utf8');
  let result: any;
  try {
    const { code } = transformSync(contents, {
      loader: configFile.endsWith('.ts') ? 'ts' : 'js',
      format: 'cjs',
      target: 'node14',
      sourcefile: configFile,
    });

    result = requireString(code, configFile);
  } catch (error: any) {
    if (error.errors) {
      throw new Error(
        formatMessagesSync(error.errors, {
          kind: 'error',
        }).join('\n')
      );
    }

    throw error;
  }
  return resolveConfigExport(result, configFile, request);
}

/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param result
 * @param configFile
 * @param request
 */
export function resolveConfigExport(
  result: any,
  configFile: string,
  request: ConfigContext | null
) {
  // add key to static config that we'll check for after the dynamic is evaluated
  // to see if the static config was used in determining the dynamic
  const hasBaseStaticConfig = NON_STANDARD_SYMBOL;
  if (request?.config) {
    // @ts-ignore
    request.config[hasBaseStaticConfig] = true;
  }
  if (result.default != null) {
    result = result.default;
  }
  const exportedObjectType = typeof result;
  if (typeof result === 'function') {
    result = result(request);
  }

  if (result instanceof Promise) {
    throw new ConfigError(`Config file ${configFile} cannot return a Promise.`, 'INVALID_CONFIG');
  }

  // If the key is not added, it suggests that the static config was not used as the base for the dynamic.
  // note(Keith): This is the most common way to use static and dynamic config together, but not the only way.
  // Hence, this is only output from getConfig() for informational purposes for use by tools like Expo Doctor
  // to suggest that there *may* be a problem.
  const mayHaveUnusedStaticConfig =
    // @ts-ignore
    request?.config?.[hasBaseStaticConfig] && !result?.[hasBaseStaticConfig];
  if (result) {
    delete result._hasBaseStaticConfig;
  }

  // If the expo object exists, ignore all other values.
  if (result?.expo) {
    result = serializeSkippingMods(result.expo);
  } else {
    result = serializeSkippingMods(result);
  }

  return { config: result, exportedObjectType, mayHaveUnusedStaticConfig };
}
