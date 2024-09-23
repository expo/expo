import { ctx } from 'expo-router/_ctx';

import { createPages } from './create-pages';
import type { RouteNode } from '../../Route';
import { getRoutes } from '../../getRoutesSSR';
import { getContextKey } from '../../matchers';
import { sortRoutes } from '../../sortRoutes';

export default createPages(async ({ createPage, createLayout, unstable_setBuildData }) => {
  const routes = getRoutes(ctx, {
    platform: process.env.EXPO_OS,
    skipGenerated: true,
    importMode: 'lazy',
  });

  if (!routes) return;

  function addLayout(route: RouteNode) {
    const normal = getContextKey(route.contextKey).replace(/\/index$/, '');
    createLayout({
      // NOTE(EvanBacon): Support routes with top-level "use client"
      component: route.loadRoute().default! as any,
      path: normal as any,
      // staticPaths
      render: 'static',
      ...route.loadRoute().unstable_settings,
    });

    route.children.sort(sortRoutes).forEach((child) => {
      if (child.type === 'layout') {
        addLayout(child);
      } else {
        const normal = getContextKey(child.contextKey).replace(/\/index$/, '');
        createPage({
          // NOTE(EvanBacon): Support routes with top-level "use client"
          component: child.loadRoute().default as any,
          path: normal as any,
          render: 'dynamic',
          ...child.loadRoute().unstable_settings,
        });
      }
    });
  }

  addLayout(routes);
});
