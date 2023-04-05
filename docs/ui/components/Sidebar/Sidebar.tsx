import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing, breakpoints } from '@expo/styleguide-base';
import type { PropsWithChildren, ComponentType } from 'react';

import { SidebarGroup, SidebarSection, VersionSelector } from './index';

import { NavigationType, NavigationRoute } from '~/types/common';

const STYLES_SIDEBAR = css`
  padding: ${spacing[4]}px;
  width: 280px;
  position: relative;
  background-color: ${theme.background.default};

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    width: 100%;
  }
`;

const STYLES_SIDEBAR_FADE = css`
  background: linear-gradient(${theme.background.default}, transparent);
  height: 30px;
  width: 274px;
  position: fixed;
  margin-top: -${spacing[4]}px;
  left: 0;
  z-index: 10;
  pointer-events: none;

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    display: none;
  }
`;

type SidebarProps = PropsWithChildren<{
  routes?: NavigationRoute[];
}>;

export type SidebarNodeProps = {
  route: NavigationRoute;
  parentRoute?: NavigationRoute;
};

export const Sidebar = ({ routes = [] }: SidebarProps) => {
  const renderTypes: Record<NavigationType, ComponentType<SidebarNodeProps> | null> = {
    section: SidebarSection,
    group: SidebarGroup,
    page: null, // Pages are rendered inside groups and should not be rendered directly
  };

  return (
    <nav css={STYLES_SIDEBAR} data-sidebar>
      <div css={[STYLES_SIDEBAR_FADE]} />
      <VersionSelector />
      {routes.map(route => {
        const Component = renderTypes[route.type];
        return !!Component && <Component key={`${route.type}-${route.name}`} route={route} />;
      })}
    </nav>
  );
};
