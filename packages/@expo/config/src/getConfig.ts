import JsonFile from '@expo/json-file';
import { existsSync } from 'fs';

import { AppJSONConfig, ConfigContext, ExpoConfig } from './Config.types';
import { ConfigError } from './Errors';
import { DynamicConfigResults, evalConfig } from './evalConfig';

// We cannot use async config resolution right now because Next.js doesn't support async configs.
// If they don't add support for async Webpack configs then we may need to pull support for Next.js.
function readConfigFile(configFile: string, context: ConfigContext): null | DynamicConfigResults {
  // If the file doesn't exist then we should skip it and continue searching.
  if (!existsSync(configFile)) {
    return null;
  }
  try {
    return evalConfig(configFile, context);
  } catch (error: any) {
    // @ts-ignore
    error.isConfigError = true;
    error.message = `Error reading Expo config at ${configFile}:\n\n${error.message}`;
    throw error;
  }
}

export function getDynamicConfig(configPath: string, request: ConfigContext): DynamicConfigResults {
  const config = readConfigFile(configPath, request);
  if (config) {
    // The config must be serialized and evaluated ahead of time so the spawned process can send it over.
    return config;
  }
  // TODO: It seems this is only thrown if the file cannot be found (which may never happen).
  // If so we should throw a more helpful error.
  throw new ConfigError(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}

export function getStaticConfig(configPath: string): AppJSONConfig | ExpoConfig {
  const config = JsonFile.read(configPath, { json5: true });
  if (config) {
    return config as any;
  }
  throw new ConfigError(`Failed to read config at: ${configPath}`, 'INVALID_CONFIG');
}
