import { parseUrlUsingCustomBase } from '../utils/url';

/**
 * Convert a route's pathname to a loader module path.
 *
 * @example
 * getLoaderModulePath(`/`);       // `/_expo/loaders/index`
 * getLoaderModulePath(`/about`)   // `/_expo/loaders/about`
 * getLoaderModulePath(`/posts/1`) // `/_expo/loaders/posts/1`
 */
export function getLoaderModulePath(routePath: string): string {
  const { pathname, search } = parseUrlUsingCustomBase(routePath);
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const pathSegment = normalizedPath === '/' ? '/index' : normalizedPath;

  return `/_expo/loaders${pathSegment}${search}`;
}

// The platform HTTP cache has no eviction API; a fresh query-string revision is how dev HMR
// stops an edited loader's declared `max-age` from serving the pre-edit response.
let devLoaderCacheRevision = 0;

/** Bump the revision appended to loader URLs so dev fetches bypass previously cached responses. */
export function bumpDevLoaderRevision() {
  devLoaderCacheRevision++;
}

/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server
 * 2. Production with static files (SSG)
 * 3. SSR environments
 *
 * @see import('packages/@expo/cli/src/start/server/metro/createServerRouteMiddleware.ts').createRouteHandlerMiddleware
 * @see import('packages/expo-server/src/vendor/environment/common.ts').createEnvironment
 */
export async function fetchLoader(routePath: string, requestInit: RequestInit = {}): Promise<any> {
  let loaderPath = getLoaderModulePath(routePath);
  if (__DEV__ && devLoaderCacheRevision > 0) {
    loaderPath += `${loaderPath.includes('?') ? '&' : '?'}_expo_loader_v=${devLoaderCacheRevision}`;
  }

  const headers = new Headers(requestInit.headers);
  headers.set('Accept', 'application/json');
  const response = await fetch(loaderPath, { ...requestInit, headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch loader data: ${response.status}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse loader data: ${error}`);
  }
}
