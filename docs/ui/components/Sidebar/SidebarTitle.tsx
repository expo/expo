import type { ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { LABEL } from '../Text';

type SidebarTitleProps = {
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
} & PropsWithChildren;

export const SidebarTitle = ({ children, Icon }: SidebarTitleProps) => (
  <div className="relative -mr-4 ml-3 flex items-center gap-2 pb-1">
    {Icon && <Icon className="icon-sm" />}
    <LABEL weight="medium" crawlable={false}>
      {children}
    </LABEL>
  </div>
);
