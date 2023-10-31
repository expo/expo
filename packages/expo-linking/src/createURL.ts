import Constants from 'expo-constants';

import { CreateURLOptions, ParsedURL } from './Linking.types';
import { hasCustomScheme, resolveScheme } from './Schemes';
import { validateURL } from './validateURL';

function getHostUri(): string | null {
  if (Constants.expoConfig?.hostUri) {
    return Constants.expoConfig.hostUri;
  } else if (!hasCustomScheme()) {
    // we're probably not using up-to-date xdl, so just fake it for now
    // we have to remove the /--/ on the end since this will be inserted again later
    return removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
  } else {
    return null;
  }
}

function isExpoHosted(): boolean {
  const hostUri = getHostUri();
  return !!(
    hostUri &&
    (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test|expo\.dev)(:.*)?(\/.*)?$/.test(hostUri) ||
      Constants.expoGoConfig?.developer)
  );
}

function removeScheme(url: string): string {
  return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}

function removePort(url: string): string {
  return url.replace(/(?=([a-zA-Z0-9+.-]+:\/\/)?[^/]):\d+/, '');
}

function removeLeadingSlash(url: string): string {
  return url.replace(/^\//, '');
}

function removeTrailingSlashAndQueryString(url: string): string {
  return url.replace(/\/?\?.*$/, '');
}

function ensureLeadingSlash(input: string, shouldAppend: boolean): string {
  const hasSlash = input.startsWith('/');
  if (hasSlash && !shouldAppend) {
    return input.substring(1);
  } else if (!hasSlash && shouldAppend) {
    return `/${input}`;
  }
  return input;
}

// @needsAudit
/**
 * Helper method for constructing a deep link into your app, given an optional path and set of query
 * parameters. Creates a URI scheme with two slashes by default.
 *
 * The scheme must be defined in the Expo config (`app.config.js` or `app.json`) under `expo.scheme`
 * or `expo.{android,ios}.scheme`. Platform-specific schemes defined under `expo.{android,ios}.scheme`
 * take precedence over universal schemes defined under `expo.scheme`.
 *
 * # Examples
 * - Development and production builds: `<scheme>://path` - uses the optional `scheme` property if provided, and otherwise uses the first scheme defined by your Expo config
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Go (dev): `exp://128.0.0.1:8081/--/path`
 *
 * The behavior of this method in Expo Go for published updates is undefined and should not be relied upon.
 * The created URL in this case is neither stable nor predictable during the lifetime of the app.
 * If a stable URL is needed, for example in authorization callbacks, a build (or development build)
 * of your application should be used and the scheme provided.
 *
 * @param path Addition path components to append to the base URL.
 * @param namedParameters Additional options object.
 * @return A URL string which points to your app with the given deep link information.
 */
export function createURL(
  path: string,
  { scheme, queryParams = {}, isTripleSlashed = false }: CreateURLOptions = {}
): string {
  const resolvedScheme = resolveScheme({ scheme });

  let hostUri = getHostUri() || '';

  if (hasCustomScheme() && isExpoHosted()) {
    hostUri = '';
  }

  if (path) {
    if (isExpoHosted() && hostUri) {
      path = `/--/${removeLeadingSlash(path)}`;
    }
    if (isTripleSlashed && !path.startsWith('/')) {
      path = `/${path}`;
    }
  } else {
    path = '';
  }

  // merge user-provided query params with any that were already in the hostUri
  // e.g. release-channel
  let queryString = '';
  const queryStringMatchResult = hostUri.match(/(.*)\?(.+)/);
  if (queryStringMatchResult) {
    hostUri = queryStringMatchResult[1];
    queryString = queryStringMatchResult[2];
    let paramsFromHostUri = {};
    try {
      paramsFromHostUri = Object.fromEntries(
        // @ts-ignore: [Symbol.iterator] is indeed, available on every platform.
        new URLSearchParams(queryString)
      );
    } catch {}
    queryParams = {
      ...queryParams,
      ...paramsFromHostUri,
    };
  }
  queryString = new URLSearchParams(
    // For legacy purposes, we'll strip out the nullish values before creating the URL.
    Object.fromEntries(
      Object.entries(queryParams).filter(([, value]) => value != null) as [string, string][]
    )
  ).toString();
  if (queryString) {
    queryString = `?${queryString}`;
  }

  hostUri = ensureLeadingSlash(hostUri, !isTripleSlashed);

  return encodeURI(
    `${resolvedScheme}:${isTripleSlashed ? '/' : ''}/${hostUri}${path}${queryString}`
  );
}

// @needsAudit
/**
 * Helper method for parsing out deep link information from a URL.
 * @param url A URL that points to the currently running experience (e.g. an output of `Linking.createURL()`).
 * @return A `ParsedURL` object.
 */
export function parse(url: string): ParsedURL {
  validateURL(url);

  const queryParams: Record<string, string> = {};
  let path: string | null = null;
  let hostname: string | null = null;
  let scheme: string | null = null;

  try {
    const parsed = new URL(url);

    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = decodeURIComponent(value);
    });
    path = parsed.pathname || null;
    hostname = parsed.hostname || null;
    scheme = parsed.protocol || null;
  } catch {
    path = url;
  }

  const hostUri = getHostUri() || '';
  const hostUriStripped = removePort(removeTrailingSlashAndQueryString(hostUri));

  if (scheme) {
    // Remove colon at end
    scheme = scheme.substring(0, scheme.length - 1);
  }

  if (path) {
    path = removeLeadingSlash(path);

    let expoPrefix: string | null = null;
    if (hostUriStripped) {
      const parts = hostUriStripped.split('/');
      expoPrefix = parts.slice(1).concat(['--/']).join('/');
    }

    if (isExpoHosted() && !hasCustomScheme() && expoPrefix && path.startsWith(expoPrefix)) {
      path = path.substring(expoPrefix.length);
      hostname = null;
    } else if (path.indexOf('+') > -1) {
      path = path.substring(path.indexOf('+') + 1);
    }
  }

  return {
    hostname,
    path,
    queryParams,
    scheme,
  };
}
