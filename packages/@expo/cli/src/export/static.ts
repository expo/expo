import type { PageHeaderInfo, RouteInfo } from 'expo-server/private';

/**
 * The manifest subset that static exports write to `_expo/.routes.json`.
 */
export type StaticManifest<TRegex = RegExp | string> = {
  headers?: Record<string, string | string[]>;
  pageHeaders?: PageHeaderInfo<TRegex>[];
  redirects?: RouteInfo<TRegex>[];
};
