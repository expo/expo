import { events } from '2g';
import type { SerializedError } from '2g';

type RunPlatform = 'ios' | 'android';

declare module '2g' {
  interface EventRegistry {
    'run:device:selected': {
      platform: RunPlatform;
      name: string;
      id: string;
      os: string | null;
      type: 'simulator' | 'emulator' | 'device';
    };
    'run:build:done': {
      platform: RunPlatform;
      scheme?: string;
      configuration?: string;
      deviceId: string | null;
    };
    'run:build:failed': {
      platform: RunPlatform;
      error: SerializedError;
    };
    'run:install': {
      platform: RunPlatform;
      appId: string;
    };
    'run:launch': {
      platform: RunPlatform;
      appId: string;
    };
  }
}

export const event = events('run');
