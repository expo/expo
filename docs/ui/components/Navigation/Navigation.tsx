import { useRouter } from 'next/compat/router';
import React, { FC, useMemo } from 'react';

import { GroupList } from './GroupList';
import { PageLink } from './PageLink';
import { SectionList } from './SectionList';
import { NavigationNode, NavigationRenderProps, NavigationType } from './types';

import { LayoutScroll, usePersistScroll } from '~/ui/components/Layout';

export type NavigationProps = {
  /** The tree of navigation nodes to render in the sidebar */
  routes: NavigationNode[];
};

export function Navigation({ routes }: NavigationProps) {
  const router = useRouter();
  const activeRoutes = useMemo(() => findActiveRoute(routes, router?.pathname), [router?.pathname]);
  const persistScroll = usePersistScroll('navigation');

  return (
    <nav className="h-full w-[280px] bg-subtle dark:bg-default">
      <LayoutScroll {...persistScroll}>
        {routes.map(route => navigationRenderer(route, activeRoutes))}
      </LayoutScroll>
    </nav>
  );
}

const renderers: Record<NavigationType, FC<React.PropsWithChildren<NavigationRenderProps>>> = {
  section: SectionList,
  group: GroupList,
  page: PageLink,
};

function navigationRenderer(
  route: NavigationNode,
  activeRoutes: Record<NavigationType, NavigationNode | null>
) {
  if (route.hidden) return null;
  const Component = renderers[route.type];
  const routeKey = `${route.type}-${route.name}`;
  const isActive = activeRoutes[route.type] === route;
  const hasChildren = route.type !== 'page' && route.children.length;
  return (
    <Component key={routeKey} route={route} isActive={isActive}>
      {hasChildren && route.children.map(nested => navigationRenderer(nested, activeRoutes))}
    </Component>
  );
}

/**
 * Find the active routes by pathname, and do it once.
 * This will iterate the tree and find the nodes which are "active".
 *   - Page -> if the pathname matches the page's href property
 *   - Group -> if the group contains an active page
 *   - Section -> if the section contains an active group or page
 */
export function findActiveRoute(routes: NavigationNode[], pathname?: string) {
  const activeRoutes: Record<NavigationType, NavigationNode | null> = {
    page: null,
    group: null,
    section: null,
  };

  if (!pathname) {
    return activeRoutes;
  }

  for (const route of routes) {
    // Try to exit early on hidden routes
    if (route.hidden) continue;

    switch (route.type) {
      case 'page':
        if (route.href === pathname) {
          activeRoutes.page = route;
          break;
        }
        break;

      case 'group':
        {
          const nestedActiveRoutes = findActiveRoute(route.children, pathname);
          if (nestedActiveRoutes?.page) {
            activeRoutes.page = nestedActiveRoutes.page;
            activeRoutes.group = route;
            break;
          }
        }
        break;

      case 'section':
        {
          const nestedActiveRoutes = findActiveRoute(route.children, pathname);
          if (nestedActiveRoutes?.group || nestedActiveRoutes?.page) {
            activeRoutes.page = nestedActiveRoutes.page;
            activeRoutes.group = nestedActiveRoutes.group;
            activeRoutes.section = route;
            break;
          }
        }
        break;
    }
  }

  return activeRoutes;
}
