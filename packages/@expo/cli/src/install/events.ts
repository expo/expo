import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'install:done': {
      packages: string[];
      dev: boolean;
      packageManager: string;
    };
    'install:fixing_dependencies': { packages: string[] };
    'install:existing_plugins': { plugins: string[] };
    'install:package_has_plugin': { package: string; hasPlugin: boolean; argCount: number | null };
    'install:auto_plugin_skipped': { package: string };
  }
}

export const event = events('install');
export const debugEvent = events.debug('install');
