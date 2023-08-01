import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import URL from 'url-parse';

// This is only run on native.
function extractExactPathFromURL(url: string): string {
  if (
    // If a universal link / app link / web URL is used, we should use the path
    // from the URL, while stripping the origin.
    url.match(/^https?:\/\//)
  ) {
    const { origin, href } = new URL(url);
    return href.replace(origin, '');
  }

  // Handle special URLs used in Expo Go: `/--/pathname` -> `pathname`
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient &&
    // while not exhaustive, `exp` and `exps` are the only two schemes which
    // are passed through to other apps in Expo Go.
    url.match(/^exp(s)?:\/\//)
  ) {
    const pathname = url.match(/exps?:\/\/.*?\/--\/(.*)/)?.[1];
    if (pathname) {
      return fromDeepLink('a://' + pathname);
    }

    const res = Linking.parse(url);

    const qs = !res.queryParams
      ? ''
      : Object.entries(res.queryParams)
          .map(([k, v]) => `${k}=${v}`)
          .join('&');
    return (
      adjustPathname({ hostname: res.hostname, pathname: res.path || '' }) + (qs ? '?' + qs : '')
    );
  }

  // TODO: Support dev client URLs

  return fromDeepLink(url);
}

/** Major hack to support the makeshift expo-development-client system. */
function isExpoDevelopmentClient(url: URL<Record<string, string | undefined>>): boolean {
  return !!url.hostname.match(/^expo-development-client$/);
}

function fromDeepLink(url: string): string {
  // This is for all standard deep links, e.g. `foobar://` where everything
  // after the `://` is the path.
  const res = new URL(url, true);

  if (isExpoDevelopmentClient(res)) {
    if (!res.query || !res.query.url) {
      return '';
    }
    const incomingUrl = res.query.url;
    return extractExactPathFromURL(decodeURI(incomingUrl));
  }

  const qs = !res.query
    ? ''
    : Object.entries(res.query as Record<string, string>)
        .map(([k, v]) => `${k}=${decodeURIComponent(v)}`)
        .join('&');

  let results = '';

  if (res.host) {
    results += res.host;
  }

  if (res.pathname) {
    results += res.pathname;
  }

  if (qs) {
    results += '?' + qs;
  }

  return results;
}

export function extractExpoPathFromURL(url: string = '') {
  // TODO: We should get rid of this, dropping specificities is not good
  return extractExactPathFromURL(url).replace(/^\//, '');
}

export function adjustPathname(url: { hostname?: string | null; pathname: string }) {
  if (url.hostname === 'exp.host' || url.hostname === 'u.expo.dev') {
    // drop the first two segments from pathname:
    return url.pathname.split('/').slice(2).join('/');
  }
  return url.pathname;
}
