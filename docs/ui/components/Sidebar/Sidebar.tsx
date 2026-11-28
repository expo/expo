import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren, ComponentType } from 'react';

import { NavigationType, NavigationRoute } from '~/types/common';

import { SidebarGroup } from './SidebarGroup';
import { SidebarSection } from './SidebarSection';
import { SidebarNodeProps } from './types';

type SidebarProps = PropsWithChildren<{
  routes?: NavigationRoute[];
}>;

export const Sidebar = ({ routes = [] }: SidebarProps) => {
  const renderTypes: Record<NavigationType, ComponentType<SidebarNodeProps> | null> = {
    section: SidebarGroup,
    group: SidebarSection,
    page: null, // Pages are rendered inside groups and should not be rendered directly
  };

  return (
    <nav
      className="relative w-full pb-4 lg:pt-2.5 max-lg:bg-default max-lg:p-4 [&>div:nth-of-type(n+3)]:[--sidebar-entry-px:8px]"
      data-sidebar>
      <div
        className={mergeClasses(
          'pointer-events-none fixed left-4 z-10 -mt-4 h-8 w-58.5',
          'bg-linear-to-b from-subtle to-transparent opacity-90',
          'max-lg:hidden'
        )}
      />
      {routes.map(route => {
        if (!route) {
          return null;
        }

        const Component = renderTypes[route.type];
        return !!Component && <Component key={`${route.type}-${route.name}`} route={route} />;
      })}
    </nav>
  );
};
