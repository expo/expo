/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createElement } from 'react';
import type { ComponentProps, FunctionComponent, ReactNode } from 'react';

import { ServerRouter } from './client';
import {
  getComponentIds,
  getInputString,
  parseInputString,
  PARAM_KEY_SKIP,
  SHOULD_SKIP_ID,
  LOCATION_ID,
} from './common';
import type { RouteProps, ShouldSkip } from './common';
import { Children, Slot } from './host';
import { getPathMapping } from '../path';
import type { PathSpec } from '../path';
import { defineEntries, rerender } from '../server';
import type { BuildConfig, RenderEntries, GetBuildConfig, GetSsrConfig } from '../server';

type RoutePropsForLayout = Omit<RouteProps, 'searchParams'> & {
  children: ReactNode;
};

type ShouldSkipValue = ShouldSkip[number][1];

export function unstable_defineRouter(
  getPathConfig: () => Promise<
    Iterable<{
      path: PathSpec;
      isStatic?: boolean;
      noSsr?: boolean;
      data?: unknown; // For build: put in customData
    }>
  >,
  getComponent: (
    componentId: string, // "**/layout" or "**/page"
    options: {
      // TODO setShouldSkip API is too hard to understand
      unstable_setShouldSkip: (val?: ShouldSkipValue) => void;
      unstable_buildConfig: BuildConfig | undefined;
    }
  ) => Promise<FunctionComponent<RouteProps> | FunctionComponent<RoutePropsForLayout> | null>
): ReturnType<typeof defineEntries> {
  type MyPathConfig = {
    pathname: PathSpec;
    isStatic?: boolean | undefined;
    customData: { noSsr?: boolean; data: unknown };
  }[];
  let cachedPathConfig: MyPathConfig | undefined;
  const getMyPathConfig = async (buildConfig?: BuildConfig): Promise<MyPathConfig> => {
    if (buildConfig) {
      return buildConfig as MyPathConfig;
    }
    if (!cachedPathConfig) {
      cachedPathConfig = Array.from(await getPathConfig()).map((item) => {
        return {
          pathname: item.path,
          isStatic: item.isStatic,
          customData: { noSsr: !!item.noSsr, data: item.data },
        };
      });
    }
    return cachedPathConfig;
  };
  const existsPath = async (
    pathname: string,
    buildConfig: BuildConfig | undefined
  ): Promise<['FOUND', 'NO_SSR'?] | ['NOT_FOUND']> => {
    const pathConfig = await getMyPathConfig(buildConfig);
    const found = pathConfig.find(({ pathname: pathSpec }) => getPathMapping(pathSpec, pathname));
    return found ? (found.customData.noSsr ? ['FOUND', 'NO_SSR'] : ['FOUND']) : ['NOT_FOUND'];
  };
  const shouldSkipObj: {
    [componentId: ShouldSkip[number][0]]: ShouldSkip[number][1];
  } = {};

  const renderEntries: RenderEntries = async (input, { searchParams, buildConfig }) => {
    const pathname = parseInputString(input);
    if ((await existsPath(pathname, buildConfig))[0] === 'NOT_FOUND') {
      return null;
    }
    const skip = searchParams.getAll(PARAM_KEY_SKIP) || [];
    searchParams.delete(PARAM_KEY_SKIP); // delete all
    const componentIds = getComponentIds(pathname);
    const entries: (readonly [string, ReactNode])[] = (
      await Promise.all(
        componentIds.map(async (id) => {
          if (skip?.includes(id)) {
            return [];
          }
          const setShoudSkip = (val?: ShouldSkipValue) => {
            if (val) {
              shouldSkipObj[id] = val;
            } else {
              delete shouldSkipObj[id];
            }
          };
          const component = await getComponent(id, {
            unstable_setShouldSkip: setShoudSkip,
            unstable_buildConfig: buildConfig,
          });
          if (!component) {
            return [];
          }

          const element = createElement(
            component as FunctionComponent<{
              path: string;
              searchParams?: URLSearchParams;
            }>,
            id.endsWith('/layout') ? { path: pathname } : { path: pathname, searchParams },
            createElement(Children)
          );
          return [[id, element]] as const;
        })
      )
    ).flat();
    entries.push([SHOULD_SKIP_ID, Object.entries(shouldSkipObj)]);
    entries.push([LOCATION_ID, [pathname, searchParams.toString()]]);
    return Object.fromEntries(entries);
  };

  const getBuildConfig: GetBuildConfig = async (unstable_collectClientModules) => {
    const pathConfig = await getMyPathConfig();
    const path2moduleIds: Record<string, string[]> = {};
    for (const { pathname: pathSpec } of pathConfig) {
      if (pathSpec.some(({ type }) => type !== 'literal')) {
        continue;
      }
      const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
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
    for (const { pathname: pathSpec, isStatic, customData } of pathConfig) {
      const entries: BuildConfig[number]['entries'] = [];
      if (pathSpec.every(({ type }) => type === 'literal')) {
        const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
        const input = getInputString(pathname);
        entries.push({ input, isStatic });
      }
      buildConfig.push({
        pathname: pathSpec,
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
      return null;
    }
    const componentIds = getComponentIds(pathname);
    const input = getInputString(pathname);
    const body = createElement(
      ServerRouter as FunctionComponent<Omit<ComponentProps<typeof ServerRouter>, 'children'>>,
      { route: { path: pathname, searchParams } },
      componentIds.reduceRight(
        (acc: ReactNode, id) =>
          createElement(
            // @ts-expect-error
            Slot,
            { id, fallback: acc },
            acc
          ),
        null
      )
    );
    return { input, body };
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
