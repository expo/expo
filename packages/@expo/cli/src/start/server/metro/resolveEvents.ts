import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'resolve:autolinking_registered': { platform: string; count: number };
    'resolve:autolinking_sticky': { platform: string; module: string; resolved: string };
    'resolve:fallback_failed': { module: string; error: string };
    'resolve:fallback_resolved': { platform: string | null; module: string; origin: string };
    'resolve:fallback_app_resolved': { platform: string | null; projectRoot: string };
    'resolve:fallback_self_resolved': { platform: string | null; module: string; root: string };
    'resolve:tsconfig_alias': { module: string; resolved: string };
    'resolve:tsconfig_baseurl': { module: string; resolved: string };
    'resolve:tsconfig_parse_failed': { path: string; error: string };
    'resolve:resolvers_appended': { count: number; hasCustom: boolean };
    'resolve:resolver_threw': {
      name: string;
      module: string;
      platform: string | null;
      env: string;
      origin: string;
      error: string;
    };
    'resolve:error_stacks_explored': { count: number };
  }
}

export const event = events.debug('resolve');
