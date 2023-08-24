import { mergeClasses } from '@expo/styleguide';
import { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  alwaysDark?: boolean;
  float?: boolean;
}>;

export const SnippetHeader = ({
  title,
  children,
  Icon,
  float,
  alwaysDark = false,
}: SnippetHeaderProps) => (
  <div
    className={mergeClasses(
      'flex pl-4 overflow-hidden justify-between bg-default border border-default min-h-[40px]',
      !float && 'rounded-t-md border-b-0',
      float && 'rounded-md my-4',
      Icon && 'pl-3',
      alwaysDark && 'dark-theme pr-2 dark:border-transparent !bg-palette-gray3'
    )}>
    <LABEL
      className={mergeClasses(
        'flex items-center gap-2 h-10 !leading-10 pr-4 select-none font-medium truncate',
        alwaysDark && 'text-palette-white'
      )}>
      {Icon && <Icon className="icon-sm" />}
      {title}
    </LABEL>
    {!!children && <div className="flex justify-end items-center">{children}</div>}
  </div>
);
