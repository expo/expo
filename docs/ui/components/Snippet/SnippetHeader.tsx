import { mergeClasses } from '@expo/styleguide';
import React, { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

import { FileStatus } from './FileStatus';

export type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  titleSlot?: ReactNode;
  alwaysDark?: boolean;
  float?: boolean;
  operationType?: 'delete' | 'add' | 'modify' | undefined;
  showOperation?: boolean;
}>;

export const SnippetHeader = ({
  title,
  children,
  Icon,
  titleSlot,
  float,
  alwaysDark = false,
  operationType,
  showOperation = false,
}: SnippetHeaderProps) => (
  <div
    data-md="snippet-header"
    className={mergeClasses(
      'border-default bg-default flex min-h-[40px] justify-between overflow-hidden border pl-4',
      !float && 'rounded-t-md border-b-0',
      float && 'rounded-md',
      Icon && 'pl-3',
      alwaysDark && 'dark-theme bg-palette-gray3! pr-2 dark:border-transparent'
    )}>
    <LABEL
      className={mergeClasses(
        'flex min-h-10 w-full items-center gap-2 overflow-x-auto py-1 pr-4 leading-tight! font-medium',
        alwaysDark && 'text-palette-white'
      )}>
      {Icon && <Icon className="icon-sm shrink-0" />}
      <span className="w-max max-w-[60dvw] truncate wrap-break-word">{title}</span>
      {showOperation && operationType ? <FileStatus type={operationType} /> : null}
      {titleSlot}
    </LABEL>
    {!!children && <div className="flex items-center justify-end">{children}</div>}
  </div>
);
