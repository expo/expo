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
  const mode: EnvironmentMode =
    options.dev || (options.device && !options.prod) ? 'development' : 'production';
  if (mode === 'production') {
    throw new CommandError(
      'BAD_ARGS',
      'Production builds are not supported yet. Pass --dev to build in development mode.'
    );
  }
  return mode;
}
