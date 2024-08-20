import { ctx } from 'expo-router/_ctx';

import { createPages } from './create-pages';

import { getRoutes } from '../../getRoutesSSR';
import { sortRoutes } from '../../sortRoutes';
import { RouteNode } from '../../Route';
import { getContextKey } from '../../matchers';

export default createPages(async ({ createPage, createLayout, unstable_setBuildData }) => {
  const files = ctx.keys();

  const routes = getRoutes(ctx, {
    platform: process.env.EXPO_OS,
    skipGenerated: true,
    importMode: 'lazy',
  });

  if (!routes) return;

  function addLayout(route: RouteNode, parent: string) {
    const normal = getContextKey(route.contextKey).replace(/\/index$/, '');
    console.log('layout:', normal);
    createLayout({
      path: normal,
      // staticPaths
      // NOTE(EvanBacon): Support routes with top-level "use client"
      component: route.loadRoute().default,
      render: 'static',
      ...route.loadRoute().unstable_settings,
      // ...config,
    });

    route.children.sort(sortRoutes).forEach((child) => {
      if (child.type === 'layout') {
        addLayout(child, normal);
      } else {
        const normal = getContextKey(child.contextKey).replace(/\/index$/, '');
        console.log('page:', normal, parent, child);
        createPage({
          path: normal,
          // NOTE(EvanBacon): Support routes with top-level "use client"
          component: child.loadRoute().default,
          render: 'dynamic',
          ...child.loadRoute().unstable_settings,
        });
      }
    });
  }

  addLayout(routes);

  // console.log(routes);

  // for (const file of files) {
  //   const mod = await ctx(file);

  //   // NOTE(EvanBacon): Support `getConfig` in routes with top-level "use client"
  //   const config = 'getConfig' in mod ? await mod.getConfig?.() : {};
  //   const pathItems = file
  //     .replace(/^\.\//, '')
  //     .replace(/\.\w+$/, '')
  //     .split('/')
  //     .filter(Boolean);

  //   const path =
  //     '/' +
  //     (['_layout', 'index'].includes(pathItems.at(-1)!) ? pathItems.slice(0, -1) : pathItems).join(
  //       '/'
  //     );

  //   unstable_setBuildData(path, files);

  //   if (pathItems.at(-1) === '_layout') {
  //     console.log('layout:', path, file);

  //     // TODO: Support static paths
  //     // const staticPaths = await mod.generateStaticParams()

  //     createLayout({
  //       path,
  //       // staticPaths
  //       // NOTE(EvanBacon): Support routes with top-level "use client"
  //       component: 'default' in mod ? mod.default : mod,
  //       render: 'static',
  //       ...config,
  //     });
  //   } else {
  //     console.log('page:', path, file);
  //     createPage({
  //       path,
  //       // NOTE(EvanBacon): Support routes with top-level "use client"
  //       component: 'default' in mod ? mod.default : mod,
  //       render: 'dynamic',
  //       ...config,
  //     });
  //   }
  // }
});
