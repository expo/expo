import type { ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { LABEL } from '../Text';

type SidebarTitleProps = {
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
} & PropsWithChildren;

export const SidebarTitle = ({ children, Icon }: SidebarTitleProps) => (
  <div className="flex gap-2 items-center relative ml-3 -mr-4 pb-1">
    {Icon && <Icon className="icon-sm" />}
    <LABEL weight="medium" crawlable={false}>
      {children}
    </LABEL>
  </div>
);
