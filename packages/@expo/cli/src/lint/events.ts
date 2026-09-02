import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'lint:eslint_config_found': { path: string };
    'lint:eslint_args': { args: string[] };
  }
}

export const event = events.debug('lint');
