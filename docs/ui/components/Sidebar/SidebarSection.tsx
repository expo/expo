import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarLink } from './SidebarLink';
import { SidebarNodeProps } from './types';

export const SidebarSection = ({ route, ...rest }: SidebarNodeProps) => {
  // If the section or group is hidden, or has no content, we should not render it
  if (route.hidden || !route.children?.length) {
    return null;
  }

  return (
    <SidebarCollapsible key={`section-${route.name}`} info={route}>
      <div className="mb-2">
        {route.children.map(child =>
          child.type === 'page' ? (
            <SidebarLink key={`${route.name}-${child.name}`} info={child}>
              {child.sidebarTitle ?? child.name}
            </SidebarLink>
          ) : (
            <SidebarSection
              key={`group-${child.name}-${route.name}`}
              route={child}
              parentRoute={route}
              {...rest}
            />
          )
        )}
      </div>
    </SidebarCollapsible>
  );
};
