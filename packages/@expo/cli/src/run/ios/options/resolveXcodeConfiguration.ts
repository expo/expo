import type { EnvironmentMode } from '../../../utils/nodeEnv';

export function resolveXcodeConfigurationMode(configuration = 'Debug'): EnvironmentMode {
  return configuration.includes('Debug') ? 'development' : 'production';
}
