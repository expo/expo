import { RouterLogo } from '@expo/styleguide';
import {
  Cube01Icon,
  CpuChip01Icon,
  EasMetadataIcon,
  LayersTwo02Icon,
  Rocket01Icon,
  TerminalBrowserIcon,
  EasSubmitIcon,
  Bell03Icon,
  PlanEnterpriseIcon,
  PaletteIcon,
  DataIcon,
  CodeSquare01Icon,
  Phone01Icon,
} from '@expo/styleguide-icons';

import { SidebarNodeProps } from './Sidebar';
import { SidebarTitle, SidebarLink, SidebarSection } from './index';

import { NavigationRoute } from '~/types/common';
import { HandWaveIcon } from '~/ui/components/CustomIcons/HandWaveIcon';

export const SidebarGroup = ({ route, parentRoute }: SidebarNodeProps) => {
  const title = route.sidebarTitle ?? route.name;
  const Icon = getIconElement(title);
  return (
    <div className="mb-5">
      {!shouldSkipTitle(route, parentRoute) && title && (
        <SidebarTitle Icon={Icon}>{title}</SidebarTitle>
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
};

function shouldSkipTitle(info: NavigationRoute, parentGroup?: NavigationRoute) {
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
}

function getIconElement(iconName?: string) {
  switch (iconName) {
    case 'Develop':
      return TerminalBrowserIcon;
    case 'Deploy':
      return Rocket01Icon;
    case 'Development process':
      return CodeSquare01Icon;
    case 'EAS Build':
      return Cube01Icon;
    case 'EAS Submit':
      return EasSubmitIcon;
    case 'EAS Update':
      return LayersTwo02Icon;
    case 'EAS Metadata':
      return EasMetadataIcon;
    case 'EAS Insights':
      return DataIcon;
    case 'Expo Modules API':
      return CpuChip01Icon;
    case 'Expo Router':
      return RouterLogo;
    case 'Push notifications':
      return Bell03Icon;
    case 'Distribution':
      return Phone01Icon;
    case 'UI programming':
      return PaletteIcon;
    case 'EAS':
      return PlanEnterpriseIcon;
    case 'Get started':
      return HandWaveIcon;
    default:
      return undefined;
  }
}
