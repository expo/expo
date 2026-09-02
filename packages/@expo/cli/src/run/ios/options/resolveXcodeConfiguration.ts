import type { EnvironmentMode } from '../../../utils/nodeEnv';

/** Match the case-sensitive `*Debug*` check in `react-native-xcode.sh`. */
export function resolveXcodeConfigurationMode(configuration = 'Debug'): EnvironmentMode {
  return configuration.includes('Debug') ? 'development' : 'production';
}
