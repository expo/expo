import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'customize:webpack_template_resolved': { moduleId: string; path: string };
    'customize:webpack_template_fallback': { moduleId: string };
    'customize:cli_template_resolved': { moduleId: string; path: string };
    'customize:cli_template_fallback': { moduleId: string; path: string };
  }
}

export const event = events.debug('customize');
