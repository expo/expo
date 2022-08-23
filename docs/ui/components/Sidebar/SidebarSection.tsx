import * as React from 'react';

import { SidebarNodeProps } from './Sidebar';
import { SidebarGroup, SidebarCollapsible } from './index';

export const SidebarSection = ({ route, ...rest }: SidebarNodeProps) => {
  // If the section or group is hidden, or has no content, we should not render it
  if (route.hidden || !route.children?.length) {
    return null;
  }

  return (
    <SidebarCollapsible key={`section-${route.name}`} info={route}>
      {route.children.map(group => (
        <SidebarGroup
          {...rest}
          key={`group-${group.name}-${route.name}`}
          route={group}
          parentRoute={route}
        />
      ))}
    </SidebarCollapsible>
  );
};
