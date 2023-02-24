import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide';

import { SidebarNodeProps } from './Sidebar';
import { SidebarGroup, SidebarCollapsible, SidebarLink } from './index';

export const SidebarSection = ({ route, ...rest }: SidebarNodeProps) => {
  // If the section or group is hidden, or has no content, we should not render it
  if (route.hidden || !route.children?.length) {
    return null;
  }

  return (
    <SidebarCollapsible key={`section-${route.name}`} info={route}>
      <div css={contentWrapperStyle}>
        {route.children.map(child =>
          child.type === 'page' ? (
            <SidebarLink key={`${route.name}-${child.name}`} info={child}>
              {child.sidebarTitle || child.name}
            </SidebarLink>
          ) : (
            <SidebarGroup
              {...rest}
              key={`group-${child.name}-${route.name}`}
              route={child}
              parentRoute={route}
            />
          )
        )}
      </div>
    </SidebarCollapsible>
  );
};

const contentWrapperStyle = css({
  marginBottom: spacing[4] + spacing[0.5],
  marginTop: spacing[1],
});
