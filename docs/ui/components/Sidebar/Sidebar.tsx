import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren, ComponentType } from 'react';

import { SidebarGroup, SidebarSection } from './index';

import { NavigationType, NavigationRoute } from '~/types/common';

type SidebarProps = PropsWithChildren<{
  routes?: NavigationRoute[];
}>;

export type SidebarNodeProps = {
  route: NavigationRoute;
  parentRoute?: NavigationRoute;
};

export const Sidebar = ({ routes = [] }: SidebarProps) => {
  const renderTypes: Record<NavigationType, ComponentType<SidebarNodeProps> | null> = {
    section: SidebarGroup,
    group: SidebarSection,
    page: null, // Pages are rendered inside groups and should not be rendered directly
  };

  return (
    <nav className="p-4 w-[280px] relative bg-default max-lg-gutters:w-full" data-sidebar>
      <div
        className={mergeClasses(
          'fixed w-[273px] h-8 mt-[-22px] left-0 z-10 pointer-events-none bg-gradient-to-b from-default to-transparent',
          'max-lg-gutters:hidden'
        )}
      />
      {routes.map(route => {
        const Component = renderTypes[route.type];
        return !!Component && <Component key={`${route.type}-${route.name}`} route={route} />;
      })}
    </nav>
  );
};
