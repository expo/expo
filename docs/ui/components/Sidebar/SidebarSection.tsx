import { SidebarNodeProps } from './Sidebar';
import { SidebarGroup, SidebarCollapsible, SidebarLink } from './index';

export const SidebarSection = ({ route, ...rest }: SidebarNodeProps) => {
  // If the section or group is hidden, or has no content, we should not render it
  if (route.hidden || !route.children?.length) {
    return null;
  }

  return (
    <SidebarCollapsible key={`section-${route.name}`} info={route}>
      <div className="mt-1 mb-4">
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
