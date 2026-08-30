'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes } from '../getRoutes';
import type { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { cancelSplashScreenAnimationFrame } from '../utils/splash';
import { shouldLinkExternally } from '../utils/url';
import type { RouterConfig } from './routerConfigContext';
import type { StoreRedirects } from './types';

// TODO(@ubax): rename this file to useRouterConfig.ts
export function useRouterConfig(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
): { routerConfig: RouterConfig; rootComponent: ComponentType<any> } {
  const config = Constants.expoConfig?.extra?.router;
  const configValue = useMemo(() => {
    let linking: ExpoLinkingOptions | undefined;
    let rootComponent: ComponentType<any> = Fragment;
    const routeNode = getRoutes(context, {
      ...config,
      skipGenerated: true,
      ignoreEntryPoints: true,
      platform: Platform.OS,
      preserveRedirectAndRewrites: true,
    });

    const redirects: StoreRedirects[] = [config?.redirects, config?.rewrites]
      .filter(Boolean)
      .flat()
      .map((route) => {
        return [
          routePatternToRegex(parseRouteSegments(route.source)),
          route,
          shouldLinkExternally(route.destination),
        ];
      });

    if (routeNode) {
      // We have routes, so get the linking config and the root component
      linking = getLinkingConfig(routeNode, context, {
        metaOnly: linkingConfigOptions.metaOnly,
        serverUrl,
        redirects,
        skipGenerated: config?.skipGenerated ?? false,
        sitemap: config?.sitemap ?? true,
        notFound: config?.notFound ?? true,
      });
      rootComponent = getQualifiedRouteComponent(routeNode);
    } else {
      // Only error in production, in development we will show the onboarding screen
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No routes found');
      }

      // In development, we will show the onboarding screen
      rootComponent = Fragment;
    }

    return { routerConfig: { linking, redirects, routeNode }, rootComponent };
  }, [config, context, linkingConfigOptions, serverUrl]);

  useEffect(() => {
    return cancelSplashScreenAnimationFrame;
  }, []);

  return configValue;
}
