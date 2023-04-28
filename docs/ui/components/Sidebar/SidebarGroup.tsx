import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';

import { SidebarNodeProps } from './Sidebar';
import { SidebarTitle, SidebarLink, SidebarSection } from './index';

import { NavigationRoute } from '~/types/common';

export const SidebarGroup = ({ route, parentRoute }: SidebarNodeProps) => (
  <div css={[STYLES_SECTION_CATEGORY]}>
    {!shouldSkipTitle(route, parentRoute) && (
      <SidebarTitle>{route.sidebarTitle || route.name}</SidebarTitle>
    )}
    {(route.children || []).map(child =>
      child.type === 'page' ? (
        <SidebarLink key={`${route.name}-${child.name}`} info={child}>
          {child.sidebarTitle || child.name}
        </SidebarLink>
      ) : (
        <SidebarSection
          key={`group-${child.name}-${route.name}`}
          route={child}
          parentRoute={route}
        />
      )
    )}
  </div>
);

const shouldSkipTitle = (info: NavigationRoute, parentGroup?: NavigationRoute) => {
  if (info.name === parentGroup?.name) {
    // If the title of the group is Expo SDK and the section within it has the same name
    // then we shouldn't show the title twice. You might want to organize your group like
    // so it is collapsable
    return true;
  } else if (
    info.children &&
    ((info.children[0] || {}).sidebarTitle || (info.children[0] || {}).name) === info.name
  ) {
    // If the first child post in the group has the same name as the group, then hide the
    // group title, lest we be very repetitive
    return true;
  }

  return false;
};

const STYLES_SECTION_CATEGORY = css({
  marginBottom: spacing[5],
});
