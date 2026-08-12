import type { EnvMode } from '@expo/env';

export function getConfigEnvMode(): EnvMode {
  const mode = process.env.EXPO_CONFIG_MODE;
  delete process.env.EXPO_CONFIG_MODE;

  if (!mode) {
    return 'development';
  }
  if (mode !== 'development' && mode !== 'production') {
    throw new Error(
      `Invalid EXPO_CONFIG_MODE value: "${mode}". Use "development" or "production".`
    );
  }
  return mode;
}
