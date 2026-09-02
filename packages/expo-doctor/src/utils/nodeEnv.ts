import { consumeConfigEnvMode, type EnvMode } from '@expo/env';

import { env } from './env';

export function getConfigEnvMode(): EnvMode {
  return consumeConfigEnvMode() ?? (env.EAS_BUILD ? 'production' : 'development');
}
