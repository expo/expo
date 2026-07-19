import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'rsc:nested_server_boundaries': { paths: string[] };
    'rsc:skip_static_export': { input: string };
    'rsc:payload': { platform: string; input: string; rsc: string };
    'rsc:load_server_module': { urlFragment: string };
  }
}

export const event = events.debug('rsc');
