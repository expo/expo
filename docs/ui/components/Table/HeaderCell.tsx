import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlignToClass } from './utils';

type HeaderCellProps = PropsWithChildren<{
  align?: TextAlign | 'char';
  size?: 'md' | 'sm';
  className?: string;
}>;

export const HeaderCell = ({
  children,
  className,
  align = 'left',
  size = 'md',
}: HeaderCellProps) => (
  <th
    className={mergeClasses(
      'border-secondary text-secondary border-r px-4 py-3.5 text-xs font-medium',
      convertAlignToClass(align),
      size === 'sm' && 'py-2 text-xs',
      '[&_code]:text-secondary [&_code]:text-xs',
      'last:border-r-0',
      className
    )}>
    {children}
  </th>
);
