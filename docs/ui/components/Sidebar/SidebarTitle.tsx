import type { ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { NavigationRoute } from '~/types/common';

import { LABEL } from '../Text';
import { SidebarBadges } from './SidebarBadges';

type SidebarTitleProps = {
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  sectionName?: string;
  info?: NavigationRoute;
} & PropsWithChildren;

export const SidebarTitle = ({ children, Icon, sectionName, info }: SidebarTitleProps) => (
  <div
    className="relative -mr-4 ml-3 flex items-center gap-2 pb-1"
    {...(sectionName && { 'data-section-name': sectionName })}>
    {Icon && <Icon aria-hidden="true" className="icon-sm" />}
    <LABEL weight="medium" crawlable={false}>
      {children}
    </LABEL>
    {info && <SidebarBadges info={info} className="ml-0" />}
  </div>
);
