import { mergeClasses } from '@expo/styleguide';
import React, { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { FileStatus } from './FileStatus';

import { LABEL } from '~/ui/components/Text';

export type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  alwaysDark?: boolean;
  float?: boolean;
  operationType?: 'delete' | 'add' | 'modify' | undefined;
  showOperation?: boolean;
}>;

export const SnippetHeader = ({
  title,
  children,
  Icon,
  float,
  alwaysDark = false,
  operationType,
  showOperation = false,
}: SnippetHeaderProps) => (
  <div
    className={mergeClasses(
      'flex min-h-[40px] justify-between overflow-hidden border border-default bg-default pl-4',
      !float && 'rounded-t-md border-b-0',
      float && 'rounded-md',
      Icon && 'pl-3',
      alwaysDark && 'dark-theme !bg-palette-gray3 pr-2 dark:border-transparent'
    )}>
    <LABEL
      className={mergeClasses(
        'flex min-h-10 w-full items-center gap-2 py-1 pr-4 font-medium !leading-tight',
        alwaysDark && 'text-palette-white'
      )}>
      {Icon && <Icon className="icon-sm shrink-0" />}
      <span className="break-words">{title}</span>
      {showOperation && operationType ? <FileStatus type={operationType} /> : null}
    </LABEL>
    {!!children && <div className="flex items-center justify-end">{children}</div>}
  </div>
);
