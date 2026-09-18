import { consumeConfigEnvMode, type EnvMode } from '@expo/env';

export function getConfigEnvMode(defaultMode: EnvMode): EnvMode {
  return consumeConfigEnvMode() ?? defaultMode;
}
