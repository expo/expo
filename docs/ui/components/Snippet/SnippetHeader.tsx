import { mergeClasses, LinkBase } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import React, { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { FileStatus } from './FileStatus';

import { LABEL, A } from '~/ui/components/Text';

export type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  alwaysDark?: boolean;
  float?: boolean;
  operationType?: 'delete' | 'add' | 'modify' | undefined;
  showOperation?: boolean;
  linkUrl?: string;
}>;

export const SnippetHeader = ({
  title,
  children,
  Icon,
  float,
  alwaysDark = false,
  operationType,
  showOperation = false,
  linkUrl,
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
      {showOperation && operationType ? <FileStatus type={operationType} /> : null}
      <ArrowUpRightIcon
        onClick={() => window.open(linkUrl, '_blank')}
        className="text-icon-secondary shrink-0 icon-sm"
      />
    </LABEL>
    {!!children && <div className="flex justify-end items-center">{children}</div>}
  </div>
);
