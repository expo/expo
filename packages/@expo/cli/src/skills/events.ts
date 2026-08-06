import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'skills:skipped_skill': { package: string; skill: string; reason: string };
    'skills:auto_sync_skipped': { reason: string };
  }
}

export const event = events('skills');
export const debugEvent = events.debug('skills');
