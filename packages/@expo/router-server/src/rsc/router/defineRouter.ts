/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  getComponentIds,
  getInputString,
  parseInputString,
  PARAM_KEY_SKIP,
  SHOULD_SKIP_ID,
  LOCATION_ID,
  Children,
  ServerRouter,
  Slot,
  type RouteProps,
  type ShouldSkip,
} from 'expo-router/internal/rsc';
import type { ComponentProps, FunctionComponent, ReactNode } from 'react';
import { createElement } from 'react';

import { rerender } from '../server';
import type {
  BuildConfig,
  RenderEntries,
  GetBuildConfig,
  GetSsrConfig,
  defineEntries,
} from '../server';

type RoutePropsForLayout = Omit<RouteProps, 'searchParams'> & {
  children: ReactNode;
};

type ShouldSkipValue = ShouldSkip[number][1];

const safeJsonParse = (str: unknown) => {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      if (typeof obj === 'object') {
        return obj as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
};

const parseSkipList = (value: unknown): Set<string> => {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((v): v is string => typeof v === 'string'));
};

export function unstable_defineRouter(
  getPathConfig: () => Promise<
    Iterable<{
      path: string;
      matchesPathname: (pathname: string) => boolean;
      isStatic?: boolean;
      noSsr?: boolean;
      data?: unknown; // For build: put in customData
    }>
  >,
  getComponent: (
    componentId: string,
    options: {
      // TODO setShouldSkip API is too hard to understand
      unstable_setShouldSkip: (val?: ShouldSkipValue) => void;
      unstable_buildConfig: BuildConfig | undefined;
    }
  ) => Promise<
    | { component: FunctionComponent<RouteProps>; kind: 'page' }
    | { component: FunctionComponent<RoutePropsForLayout>; kind: 'layout' }
    | null
  >
): ReturnType<typeof defineEntries> {
  type MyPathConfig = {
    pathname: string;
    matchesPathname: (pathname: string) => boolean;
    isStatic?: boolean | undefined;
    customData: { noSsr?: boolean; is404: boolean; data: unknown };
  }[];
  let cachedPathConfig: MyPathConfig | undefined;
  const getMyPathConfig = async (buildConfig?: BuildConfig): Promise<MyPathConfig> => {
    if (buildConfig) {
      return buildConfig as MyPathConfig;
    }
    if (!cachedPathConfig) {
      cachedPathConfig = Array.from(await getPathConfig()).map((item) => ({
        pathname: item.path,
        matchesPathname: item.matchesPathname,
        isStatic: item.isStatic,
        customData: {
          is404: item.path === '/404',
          noSsr: !!item.noSsr,
          data: item.data,
        },
      }));
    }
    return cachedPathConfig;
  };
  const existsPath = async (
    pathname: string,
    buildConfig: BuildConfig | undefined
  ): Promise<['FOUND', 'NO_SSR'?] | ['NOT_FOUND', 'HAS_404'?]> => {
    const pathConfig = await getMyPathConfig(buildConfig);
    const found = pathConfig.find(({ matchesPathname }) => matchesPathname(pathname));
    return found
      ? found.customData.noSsr
        ? ['FOUND', 'NO_SSR']
        : ['FOUND']
      : pathConfig.some(({ customData: { is404 } }) => is404) // FIXMEs should avoid re-computation
        ? ['NOT_FOUND', 'HAS_404']
        : ['NOT_FOUND'];
  };
  const renderEntries: RenderEntries = async (input, { params, buildConfig }) => {
    const pathname = parseInputString(input);
    if ((await existsPath(pathname, buildConfig))[0] === 'NOT_FOUND') {
      return null;
    }
    const shouldSkipObj: {
      [componentId: ShouldSkip[number][0]]: ShouldSkip[number][1];
    } = {};

    const parsedParams = safeJsonParse(params);

    const query = typeof parsedParams?.query === 'string' ? parsedParams.query : '';
    const skip = parseSkipList(parsedParams?.skip);
    const { layouts, page } = getComponentIds(pathname);
    const entries: (readonly [string, ReactNode])[] = (
      await Promise.all(
        [...layouts, page].map(async (id) => {
          // `getComponentIds` separates the terminal page from layouts. Use that
          // structural distinction as a fast-path skip (kind isn't known until we
          // resolve); the kind-based check after resolve is the authoritative defense.
          const isPage = id === page;
          if (isPage && skip.has(id)) {
            return [];
          }
          const setShouldSkip = (val?: ShouldSkipValue) => {
            if (val) {
              shouldSkipObj[id] = val;
            } else {
              delete shouldSkipObj[id];
            }
          };
          const resolved = await getComponent(id, {
            unstable_setShouldSkip: setShouldSkip,
            unstable_buildConfig: buildConfig,
          });
          if (!resolved) {
            return [];
          }
          // Honor skip only for entries the resolver opted into shouldSkipObj; layouts are never skippable.
          if (skip.has(id) && resolved.kind !== 'layout' && shouldSkipObj[id] != null) {
            return [];
          }
          const element = createElement(
            resolved.component as FunctionComponent<{
              path: string;
              query?: string;
            }>,
            isPage ? { path: pathname, query } : { path: pathname },
            createElement(Children)
          );
          return [[id, element]] as const;
        })
      )
    ).flat();
    entries.push([SHOULD_SKIP_ID, Object.entries(shouldSkipObj)]);
    entries.push([LOCATION_ID, [pathname, query]]);
    return Object.fromEntries(entries);
  };

  const getBuildConfig: GetBuildConfig = async (unstable_collectClientModules) => {
    const pathConfig = await getMyPathConfig();
    const path2moduleIds: Record<string, string[]> = {};

    for (const { pathname } of pathConfig) {
      if (pathname.includes('[')) {
        continue;
      }
      const input = getInputString(pathname);
      const moduleIds = await unstable_collectClientModules(input);
      path2moduleIds[pathname] = moduleIds;
    }
    const customCode = `
globalThis.__EXPO_ROUTER_PREFETCH__ = (path) => {
  const path2ids = ${JSON.stringify(path2moduleIds)};
  for (const id of path2ids[path] || []) {
    import(id);
  }
};`;
    const buildConfig: BuildConfig = [];
    for (const { pathname, isStatic, customData } of pathConfig) {
      const entries: BuildConfig[number]['entries'] = [];
      if (!pathname.includes('[')) {
        const input = getInputString(pathname);
        entries.push({ input, isStatic });
      }
      buildConfig.push({
        pathname,
        isStatic,
        entries,
        customCode,
        customData,
      });
    }
    return buildConfig;
  };

  const getSsrConfig: GetSsrConfig = async (pathname, { searchParams, buildConfig }) => {
    const pathStatus = await existsPath(pathname, buildConfig);
    if (pathStatus[1] === 'NO_SSR') {
      return null;
    }
    if (pathStatus[0] === 'NOT_FOUND') {
      if (pathStatus[1] === 'HAS_404') {
        pathname = '/404';
      } else {
        return null;
      }
    }
    const { layouts, page } = getComponentIds(pathname);
    const input = getInputString(pathname);
    const html = createElement(
      ServerRouter as FunctionComponent<Omit<ComponentProps<typeof ServerRouter>, 'children'>>,
      { route: { path: pathname, query: searchParams.toString(), hash: '' } },
      [...layouts, page].reduceRight(
        (acc: ReactNode, id) => createElement(Slot, { id, fallback: acc }, acc),
        null
      )
    );
    return {
      input,
      params: JSON.stringify({ query: searchParams.toString() }),
      html,
    };
  };

  return { renderEntries, getBuildConfig, getSsrConfig };
}

export function unstable_redirect(
  pathname: string,
  searchParams?: URLSearchParams,
  skip?: string[]
) {
  if (skip) {
    searchParams = new URLSearchParams(searchParams);
    for (const id of skip) {
      searchParams.append(PARAM_KEY_SKIP, id);
    }
  }
  const input = getInputString(pathname);
  rerender(input, searchParams);
}
