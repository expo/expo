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
    <nav className="bg-default max-lg-gutters:w-full relative w-[280px] p-4" data-sidebar>
      <div
        className={mergeClasses(
          'pointer-events-none fixed left-0 z-10 mt-[-22px] h-8 w-[273px]',
          'from-default bg-linear-to-b to-transparent opacity-90',
          'max-lg-gutters:hidden'
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
