import type { EnvironmentMode } from '../../../utils/nodeEnv';

/** Use development mode for Xcode configurations that include `Debug` and production mode for every other configuration. */
export function resolveXcodeConfigurationMode(configuration = 'Debug'): EnvironmentMode {
  return configuration.toLowerCase().includes('debug') ? 'development' : 'production';
}
