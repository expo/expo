import * as Linking from 'expo-linking';

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

  const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;

  // Handle special URLs used in Expo Go: `/--/pathname` -> `pathname`
  if (
    isExpoGo &&
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
function isExpoDevelopmentClient(url: URL): boolean {
  return url.hostname === 'expo-development-client';
}

function fromDeepLink(url: string): string {
  let res: URL;
  try {
    // This is for all standard deep links, e.g. `foobar://` where everything
    // after the `://` is the path.
    res = new URL(url);
  } catch {
    return url;
  }

  if (isExpoDevelopmentClient(res)) {
    if (!res.searchParams.get('url')) {
      return '';
    }
    const incomingUrl = res.searchParams.get('url')!;
    return extractExactPathFromURL(decodeURI(incomingUrl));
  }

  let results = '';

  if (res.host) {
    results += res.host;
  }

  if (res.pathname) {
    results += res.pathname;
  }

  const qs = !res.search
    ? ''
    : // @ts-ignore: `entries` is not on `URLSearchParams` in some typechecks.
      [...res.searchParams.entries()].map(([k, v]) => `${k}=${decodeURIComponent(v)}`).join('&');

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
