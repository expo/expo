import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'typegen:ts_file_changed': { path: string; eventType: string };
    'typegen:ts_file_added': { path: string };
    'typegen:file_observed': { path: string };
    'typegen:watched_files': { paths: string[] };
    'typegen:removing_side_effects': Record<string, never>;
    'typegen:ensuring_side_effects': { typesDirectory: string };
  }
}

export const debugEvent = events.debug('typegen');
