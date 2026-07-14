import type { RouteInfo } from 'expo-server/private';

/**
 * The manifest subset that static exports write to `_expo/.routes.json`.
 */
export type StaticManifest<TRegex = RegExp | string> = {
  headers?: Record<string, string | string[]>;
  redirects?: RouteInfo<TRegex>[];
};
