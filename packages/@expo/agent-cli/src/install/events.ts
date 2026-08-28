import { events } from '2g';

import type { InstallImpactReport } from '../project/types';

declare module '2g' {
  interface EventRegistry {
    'install:impact': { packages: string[]; reports: InstallImpactReport[] };
  }
}

export const event = events('install');
export const debugEvent = events.debug('install');
