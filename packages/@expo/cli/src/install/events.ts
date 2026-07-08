import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'install:done': {
      packages: string[];
      dev: boolean;
      packageManager: string;
    };
  }
}

export const event = events('install');
