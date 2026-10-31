import * as Linking from 'expo-linking';
import { createElement, useEffect } from 'react';

import { cleanPath } from './fork/getStateFromPath-forks';
import type { RedirectConfig } from './getRoutesCore';
import type { StoreRedirects } from './global-state/types';
import { matchDynamicName } from './matchers';
import { shouldLinkExternally } from './utils/url';

export function applyRedirects(
  url: string | null | undefined,
  redirects: StoreRedirects[] | undefined
): string | undefined | null {
  if (typeof url !== 'string' || !redirects) {
    return url;
  }

  const nextUrl = cleanPath(url);
  const redirect = redirects.find(([regex]) => regex.test(nextUrl));

  if (!redirect) {
    return url;
  }

  // If the redirect is external, open the URL
  if (redirect[2]) {
    let href = redirect[1].destination;

    if (href.startsWith('//') && process.env.EXPO_OS !== 'web') {
      href = `https:${href}`;
    }

    // TODO: Revisit whether redirect resolution should open external URLs or only return them.
    Linking.openURL(href);
    return href;
  }

  return applyRedirects(convertRedirect(url, redirect[1]), redirects);
}

export function getRedirectModule(redirectConfig: RedirectConfig) {
  return {
    default: function RedirectComponent() {
      // `usePathname()` omits the query string. Static pages need it so `/old/abc?utm=x` stays `?utm=x`.
      const path = require('./hooks').useRouteInfo().pathnameWithParams;

      const isExternal = shouldLinkExternally(redirectConfig.destination);

      useEffect(() => {
        if (isExternal) {
          let href = redirectConfig.destination;
          if (href.startsWith('//') && process.env.EXPO_OS !== 'web') {
            href = `https:${href}`;
          }

          Linking.openURL(href);
        }
      }, []);

      if (isExternal) {
        return null;
      }

      const href = convertRedirect(path, redirectConfig);

      return createElement(require('./link/Link').Redirect, {
        href,
      });
    },
  };
}

export function convertRedirect(path: string, config: RedirectConfig) {
  const params: Record<string, string | string[]> = {};

  // Static redirect configs drop the leading slash (`old/[id]`). The pathname still has one
  // (`/old/abc`), so comparing raw `split('/')` results shifts every dynamic segment by one.
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const parts = pathname.split('/').filter(Boolean);
  const sourceParts = config.source.split('/').filter(Boolean);

  for (const [index, sourcePart] of sourceParts.entries()) {
    const dynamicName = matchDynamicName(sourcePart);
    if (!dynamicName) {
      continue;
    } else if (!dynamicName.deep) {
      params[dynamicName.name] = parts[index]!;
      continue;
    } else {
      params[dynamicName.name] = parts.slice(index);
      break;
    }
  }

  // `mergeVariablesWithPath` drops the empty segment from a leading slash, so prefix one here.
  return `/${mergeVariablesWithPath(config.destination, params)}${suffix}`;
}

export function mergeVariablesWithPath(path: string, params: Record<string, string | string[]>) {
  return path
    .split('/')
    .map((part) => {
      const dynamicName = matchDynamicName(part);
      if (!dynamicName) {
        return part;
      } else {
        const param = params[dynamicName.name];
        delete params[dynamicName.name];
        return param;
      }
    })
    .filter(Boolean)
    .join('/');
}
