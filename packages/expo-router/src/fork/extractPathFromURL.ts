export function parsePathAndParamsFromExpoGoLink(url: string): {
  pathname: string;
  queryString: string;
} {
  // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
  // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`

  const href = parsePathFromExpoGoLink(url);
  const results = href.match(/([^?]*)(\?.*)?/);
  return {
    pathname: results?.[1] ?? '',
    queryString: results?.[2] ?? '',
  };
}

export function parsePathFromExpoGoLink(url: string): string {
  // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
  // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
  return url.match(/exps?:\/\/.*?\/--\/(.*)/)?.[1] ?? '';
}

// This is only run on native.
function extractExactPathFromURL(url: string): string {
  if (
    // If a universal link / app link / web URL is used, we should use the path
    // from the URL, while stripping the origin.
    url.match(/^https?:\/\//)
  ) {
    const { origin, href, hostname } = new URL(url);

    if (hostname === 'exp.host' || hostname === 'u.expo.dev') {
      // These are QR code generate deep-link that always like to the '/' path
      // TODO: In the future, QR code may link to a specific path and this logic will need to be udpated
      return '';
    }

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
    const pathname = parsePathFromExpoGoLink(url);
    if (pathname) {
      return fromDeepLink('a://' + pathname);
    }
    // Match the `?.*` segment of the URL.
    const queryParams = url.match(/exps?:\/\/.*\?(.*)/)?.[1];
    if (queryParams) {
      return fromDeepLink('a://?' + queryParams);
    }

    return '';
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
  return (
    extractExactPathFromURL(url)
      // TODO: We should get rid of this, dropping specificities is not good
      .replace(/^\//, '')
  );
}
