import { events } from '2g';
import type { SerializedError } from '2g';

import type { EnvironmentMode } from '../utils/nodeEnv';
import type { OutputType, Platform } from './resolveOptions';

declare module '2g' {
  interface EventRegistry {
    'compile:build:done': {
      platform: Platform;
      mode: EnvironmentMode;
    };
    'compile:build:failed': {
      platform: Platform;
      error: SerializedError;
    };
    'compile:done': {
      platform: Platform;
      mode: EnvironmentMode;
      outputType: OutputType;
      outputPath: string;
    };
    'compile:ios:build_props': {
      scheme: string;
      configuration: string;
      osType: string;
      xcodeProject: string;
    };
  }
}

export const event = events('compile');
export const debugEvent = events.debug('compile');
