import * as Linking from 'expo-linking';
import { createElement, useEffect } from 'react';

import { cleanPath } from './fork/getStateFromPath-forks';
import { RedirectConfig } from './getRoutesCore';
import type { StoreRedirects } from './global-state/router-store';
import { matchDeepDynamicRouteName, matchDynamicName } from './matchers';
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

    Linking.openURL(href);
    return href;
  }

  return applyRedirects(convertRedirect(url, redirect[1]), redirects);
}

export function getRedirectModule(redirectConfig: RedirectConfig) {
  return {
    default: function RedirectComponent() {
      const pathname = require('./hooks').usePathname();

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

      const href = convertRedirect(pathname, redirectConfig);

      return createElement(require('./link/Link').Redirect, {
        href,
      });
    },
  };
}

export function convertRedirect(path: string, config: RedirectConfig) {
  const params: Record<string, string | string[]> = {};

  const parts = path.split('/');
  const sourceParts = config.source.split('/');

  for (const [index, sourcePart] of sourceParts.entries()) {
    let match = matchDynamicName(sourcePart);

    if (match) {
      params[match] = parts[index];
      continue;
    }

    match = matchDeepDynamicRouteName(sourcePart);

    if (match) {
      params[match] = parts.slice(index);
      break;
    }
  }

  return mergeVariablesWithPath(config.destination, params);
}

export function mergeVariablesWithPath(path: string, params: Record<string, string | string[]>) {
  return path
    .split('/')
    .map((part) => {
      const match = matchDynamicName(part) || matchDeepDynamicRouteName(part);
      if (!match) {
        return part;
      }

      const param = params[match];
      delete params[match];
      return param;
    })
    .filter(Boolean)
    .join('/');
}
