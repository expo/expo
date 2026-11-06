import { CommandError } from '../utils/errors';
import type { EnvironmentMode } from '../utils/nodeEnv';

export function resolveMode(options: {
  dev?: boolean;
  prod?: boolean;
  device?: string;
}): EnvironmentMode {
  if (options.dev && options.prod) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --dev, --prod');
  }
  return options.dev || (options.device && !options.prod) ? 'development' : 'production';
}
