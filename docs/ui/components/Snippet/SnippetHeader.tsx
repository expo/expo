import { mergeClasses } from '@expo/styleguide';
import React, { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

import { FileStatus } from './FileStatus';

export type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  titleSlot?: ReactNode;
  titleClassName?: string;
  className?: string;
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
  titleClassName,
  className,
  float,
  alwaysDark = false,
  operationType,
  showOperation = false,
}: SnippetHeaderProps) => (
  <div
    data-md="snippet-header"
    className={mergeClasses(
      'flex min-h-9.5 items-center justify-between gap-2 overflow-hidden border border-default bg-default pt-px pr-1.75 pb-0.5 pl-3.75',
      !float && 'rounded-t-lg border-b-0',
      float && 'rounded-lg',
      alwaysDark && 'dark-theme bg-palette-gray3! dark:border-transparent',
      className
    )}>
    <LABEL
      className={mergeClasses(
        'flex w-full items-center gap-2 self-stretch overflow-x-auto text-sm leading-[1.4] font-medium tracking-normal text-default',
        alwaysDark && 'text-palette-white'
      )}>
      {Icon && <Icon aria-hidden="true" className="icon-md shrink-0 text-icon-default" />}
      <span
        className={mergeClasses('w-max max-w-[60dvw] truncate wrap-break-word', titleClassName)}>
        {title}
      </span>
      {showOperation && operationType ? <FileStatus type={operationType} /> : null}
      {titleSlot}
    </LABEL>
    {!!children && <div className="flex shrink-0 items-center gap-1">{children}</div>}
  </div>
);
