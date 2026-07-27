import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'metro:ssr_hmr_registered': { url: string };
    'metro:ssr_hmr_unknown_message': { type: string };
    'metro:env_reload': Record<string, never>;
    'metro:rsc_route_added': { path: string };
    'metro:client_boundaries_evaluated': { count: number };
    'metro:client_boundaries_rebundle': { count: number };
    'metro:ssr_manifest': { boundaryCount: number };
    'metro:bundle_api_route': { routerRoot: string; path: string };
    'metro:api_route_overlay_failed': { error: SerializedError };
    'metro:loader_route_matched': { pathname: string; file: string };
    'metro:loader_bundle_failed': { path: string; error: SerializedError };
    'metro:loader_graph_changed': { path: string };
    'metro:transform_worker_supervisor_custom_transformer': Record<string, never>;
    'metro:transform_worker_supervisor_custom_babel_transformer': Record<string, never>;
    'metro:transform_worker_supervisor_applied': Record<string, never>;
    'metro:transform_worker_supervisor_skipped': Record<string, never>;
    'metro:polyfills_react_native_not_installed': Record<string, never>;
    'metro:options_lazy_disabled_for_export': Record<string, never>;
  }
}

export const debugEvent = events.debug('metro');
