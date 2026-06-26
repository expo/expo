import { getSingularId } from '../useScreens';

/**
 * Build the loader cache key (and request URL) for a route: its resolved URL — `pathname` with
 * dynamic segments filled from `params`, plus the query string. The single source of this key, so
 * the `useLoaderData` read and the navigation warm always agree.
 *
 * @param contextKey Already normalized via `getContextKey` (e.g. `/posts/[id]`).
 */
export function resolveLoaderKey(
  contextKey: string,
  params: Record<string, string | string[]>,
  searchParams?: URLSearchParams
): string {
  const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
  const resolvedPathname = `/${getSingularId(contextPath, { params })}`;
  const searchString = searchParams?.toString() || '';

  return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
}
