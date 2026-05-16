import { ctx } from 'expo-router/_ctx';
import {
  getContextKey,
  sortRoutes,
  type RouteNode,
} from 'expo-router/internal/routing';

import { createPages, type CreatePagesApi } from './createPages';
import type { EntriesDev } from '../server';
import { getRoutes } from '../../getRoutesSSR';
import { evalStaticParamsAsync } from '../../loadStaticParamsAsync';

type RouteSettings = {
  render?: 'static' | 'dynamic';
  unstable_disableSSR?: boolean;
};

function readSettings(loaded: { unstable_settings?: unknown }): RouteSettings {
  const raw = (loaded.unstable_settings ?? {}) as Record<string, unknown>;
  const render = raw.render === 'static' || raw.render === 'dynamic' ? raw.render : undefined;
  const unstable_disableSSR =
    typeof raw.unstable_disableSSR === 'boolean' ? raw.unstable_disableSSR : undefined;
  return { render, unstable_disableSSR };
}

const UNIMPLEMENTED_PARAMS = new Proxy(
  {},
  {
    get() {
      throw new Error('generateStaticParams(): params is not implemented yet');
    },
  }
);

async function loadStaticParamsForRoute(route: RouteNode): Promise<string[][] | undefined> {
  const loaded = route.loadRoute();

  if (!route.dynamic) {
    if (loaded.generateStaticParams) {
      throw new Error(
        'Cannot use generateStaticParams without a dynamic route: ' + route.contextKey
      );
    }
    return undefined;
  }

  const params = await evalStaticParamsAsync(
    route,
    { parentParams: UNIMPLEMENTED_PARAMS },
    loaded.generateStaticParams
  );

  return params?.map((p) => {
    const grouped: string[] = [];
    for (const dynamic of route.dynamic!) {
      const defined = p[dynamic.name];
      if (!defined) {
        throw new Error(
          'generateStaticParams is missing param: ' +
            dynamic.name +
            '. In route: ' +
            route.contextKey
        );
      }
      if (Array.isArray(defined) && defined.length > 1) {
        throw new Error(
          'generateStaticParams does not support returning multiple static paths for deep dynamic routes in React Server Components yet. Update route: ' +
            route.contextKey
        );
      }
      const first = Array.isArray(defined) ? defined[0] : defined;
      if (first != null) {
        grouped.push(first);
      }
    }
    return grouped;
  });
}

async function registerRouteTree(
  api: CreatePagesApi,
  route: RouteNode,
  getRouteOptions: Parameters<typeof getRoutes>[1] | undefined
): Promise<void> {
  const layoutPath = getContextKey(route.contextKey).replace(/\/index$/, '');
  const loaded = route.loadRoute();

  if (loaded.generateStaticParams) {
    throw new Error(
      'generateStaticParams is not supported in _layout routes with React Server Components enabled yet.'
    );
  }

  const layoutSettings = readSettings(loaded);
  api.createLayout({
    component: loaded.default! as any,
    path: layoutPath,
    render: layoutSettings.render ?? 'static',
  });

  await Promise.all(
    route.children.sort(sortRoutes).map(async (child) => {
      if (child.type === 'layout') {
        await registerRouteTree(api, child, getRouteOptions);
        return;
      }
      const childPath = getContextKey(child.contextKey).replace(/\/index$/, '');
      const childLoaded = child.loadRoute();
      const settings = readSettings(childLoaded);

      if (childLoaded.generateStaticParams) {
        api.createPage({
          component: childLoaded.default as any,
          path: childPath,
          render: 'static',
          staticPaths: (await loadStaticParamsForRoute(child)) as any,
          unstable_disableSSR: settings.unstable_disableSSR,
        });
        if (settings.render !== 'static') {
          api.createPage({
            component: childLoaded.default as any,
            path: childPath,
            render: 'dynamic',
            unstable_disableSSR: settings.unstable_disableSSR,
          });
        }
        return;
      }

      api.createPage({
        component: childLoaded.default as any,
        path: childPath,
        render: settings.render ?? 'dynamic',
        unstable_disableSSR: settings.unstable_disableSSR,
      });
    })
  );
}

export default (getRouteOptions?: Parameters<typeof getRoutes>[1]): EntriesDev => ({
  default: createPages(async ({ createPage, createLayout, unstable_setBuildData }) => {
    const routes = getRoutes(ctx, {
      ...getRouteOptions,
      platform: process.env.EXPO_OS,
      skipGenerated: true,
      importMode: 'lazy',
    });
    if (!routes) return;
    await registerRouteTree(
      { createPage, createLayout, unstable_setBuildData },
      routes,
      getRouteOptions
    );
  }),
});
