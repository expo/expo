import type { EntriesDev } from '../server';

/** Shape of a router module loaded via Metro SSR (full or client-only). */
export type RouterModule = {
  default: (getRouteOptions?: any) => EntriesDev;
};

/**
 * Resolve the absolute file path of the router module to load. Two modes:
 * full (Expo Router file tree walker) or client-only (no-op).
 *
 * The cli passes the returned path to Metro's SSR loader.
 */
export function resolveRouterModule(clientOnly: boolean): string {
  return clientOnly ? require.resolve('./noopRouter') : require.resolve('./expo-definedRouter');
}
