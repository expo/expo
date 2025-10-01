/**
 * Convert a route's pathname to a loader module path.
 *
 * @example
 * getLoaderModulePath(`/`);       // `/_expo/loaders/index`
 * getLoaderModulePath(`/about`)   // `/_expo/loaders/about`
 * getLoaderModulePath(`/posts/1`) // `/_expo/loaders/posts/1`
 */
export function getLoaderModulePath(pathname: string): string {
  const urlPath = new URL(pathname, 'http://localhost').pathname;
  const normalizedPath = urlPath === '/' ? '/' : urlPath.replace(/\/$/, '');
  const pathSegment = normalizedPath === '/' ? '/index' : normalizedPath;

  return `/_expo/loaders${pathSegment}`;
}

/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 */
export async function fetchLoaderModule(routePath: string): Promise<any> {
  const loaderPath = getLoaderModulePath(routePath);

  const response = await fetch(loaderPath, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch loader data: ${response.status}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse loader data: ${error}`);
  }
}
