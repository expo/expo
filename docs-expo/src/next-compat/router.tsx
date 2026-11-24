import { router as expoRouter, usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { events } from './events';
import { normalizeHref } from './url';

type Url = string | { pathname?: string; query?: Record<string, string>; hash?: string };

// A URL object without a `pathname` is a change to the query or the hash of the current page.
function toHref(url: Url) {
  if (typeof url === 'string') {
    return normalizeHref(url);
  }
  const search = url.query ? new URLSearchParams(url.query).toString() : '';
  return normalizeHref(
    `${url.pathname ?? window.location.pathname}${search ? `?${search}` : ''}${url.hash ?? ''}`
  );
}

function withoutTrailingSlash(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function withTrailingSlash(pathname: string) {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function navigate(method: 'push' | 'replace', url: Url) {
  const href = toHref(url);
  const target = new URL(href, window.location.href);
  const isSamePage =
    target.origin === window.location.origin &&
    withoutTrailingSlash(target.pathname) === withoutTrailingSlash(window.location.pathname);

  events.emit('routeChangeStart', href);
  if (isSamePage) {
    // Next.js keeps the page mounted for a change to the query or the hash. The History API
    // changes the URL and keeps the Expo Router state.
    // Next.js replaces the history entry when the new URL is the current URL.
    const { pathname, search, hash } = window.location;
    const isSameUrl = target.pathname + target.search + target.hash === pathname + search + hash;
    const historyMethod = method === 'push' && !isSameUrl ? 'pushState' : 'replaceState';
    window.history[historyMethod](window.history.state, '', href);
    notifyLocationListeners();
    events.emit('routeChangeComplete', href);
  } else {
    expoRouter[method](href as any);
  }
  return Promise.resolve(true);
}

function push(url: Url) {
  return navigate('push', url);
}

function replace(url: Url) {
  return navigate('replace', url);
}

function prefetch(url: string) {
  expoRouter.prefetch(url as any);
  return Promise.resolve();
}

// The location state that the router hook reads. Next.js has the same two rules:
// - The first render in the browser reads the URL hash. There is no second render after
//   hydration for a URL that has no query.
// - For a URL that has a query, `isReady` is `false` and `query` is empty in the first
//   render. They change after hydration.
let isQueryReady = typeof window !== 'undefined' && window.location.search === '';
const locationListeners = new Set<() => void>();

function notifyLocationListeners() {
  locationListeners.forEach(listener => listener());
}

function subscribeToLocation(onChange: () => void) {
  locationListeners.add(onChange);
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    locationListeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

function getLocationSnapshot() {
  if (typeof window === 'undefined') {
    return 'false|';
  }
  return `${isQueryReady}|${window.location.search}${window.location.hash}`;
}

/**
 * The Pages Router `useRouter` of Next.js, for a site that sets `trailingSlash: true`.
 * `pathname` has no trailing slash. `asPath` has one, and also has the query and the hash
 * in the browser.
 */
export function useRouter() {
  const pathname = withoutTrailingSlash(usePathname());
  // The same function gives the snapshot for hydration, so that hydration does not cause
  // a second render.
  const snapshot = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getLocationSnapshot
  );
  const separator = snapshot.indexOf('|');
  const isReady = snapshot.slice(0, separator) === 'true';
  const suffix = snapshot.slice(separator + 1);

  return useMemo(() => {
    const search = suffix.split('#')[0];
    return {
      pathname,
      route: pathname,
      asPath: withTrailingSlash(pathname) + suffix,
      query: (isReady ? Object.fromEntries(new URLSearchParams(search)) : {}) as Record<
        string,
        string
      >,
      isReady,
      events,
      push,
      replace,
      prefetch,
      back: () => expoRouter.back(),
      reload: () => window.location.reload(),
    };
  }, [pathname, suffix, isReady]);
}

/**
 * Makes `isReady` and `query` available for a URL that has a query. Call it in each route
 * component.
 *
 * The static HTML has a Suspense boundary around the root layout and one around the route.
 * When this change came from an effect in the root layout, React reported a hydration error
 * (error 418) for a URL that has a query. With the effect in the route component, the route
 * hydrates with the same `query` as the static HTML. Next.js has no such boundaries.
 */
export function useRouterReady() {
  useEffect(() => {
    if (!isQueryReady) {
      isQueryReady = true;
      notifyLocationListeners();
    }
  }, []);
}

/** Emits `routeChangeComplete` after each navigation. Render it one time in the root layout. */
export function RouteChangeEvents() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;

    const { search, hash } = window.location;
    notifyLocationListeners();
    events.emit('routeChangeComplete', withTrailingSlash(pathname) + search + hash);
  }, [pathname]);

  return null;
}

// Expo Router removes the trailing slash from the URL that it writes to the address bar.
// Next.js keeps it when `trailingSlash` is `true`.
if (typeof window !== 'undefined') {
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (state, unused, url) =>
      original(state, unused, typeof url === 'string' ? normalizeHref(url) : url);
  }
}

export default { events, push, replace, prefetch };
