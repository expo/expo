import React, { ComponentType } from 'react';

import { GroupList } from './GroupList';
import { PageLink } from './PageLink';
import { SectionList } from './SectionList';
import { NavigationNode, NavigationRenderProps, NavigationType } from './types';

export type NavigationProps = {
  /** The tree of navigation nodes to render in the sidebar */
  routes: NavigationNode[];
};

export function Navigation({ routes }: NavigationProps) {
  return <nav>{routes.map(navigationRenderer)}</nav>;
}

const renderers: Record<NavigationType, ComponentType<NavigationRenderProps>> = {
  section: SectionList,
  group: GroupList,
  page: PageLink,
};

function navigationRenderer(route: NavigationNode) {
  if (route.hidden) return null;
  const Component = renderers[route.type];
  const routeKey = `${route.type}-${route.name}`;
  const hasChildren = route.type !== 'page' && route.children.length;
  return (
    <Component key={routeKey} route={route}>
      {hasChildren && route.children.map(navigationRenderer)}
    </Component>
  );
}
