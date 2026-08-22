import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'project:fingerprint_failed': { command?: string; error: string };
    'project:config_plugins_unknown': { reason: string };
  }
}

export const event = events('project');
export const debugEvent = events.debug('project');
