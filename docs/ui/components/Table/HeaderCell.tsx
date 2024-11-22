import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlignToClass } from './utils';

type HeaderCellProps = PropsWithChildren<{
  align?: TextAlign | 'char';
  size?: 'md' | 'sm';
}>;

export const HeaderCell = ({ children, align = 'left', size = 'md' }: HeaderCellProps) => (
  <th
    className={mergeClasses(
      'border-r border-secondary px-4 py-3.5 font-medium text-secondary',
      convertAlignToClass(align),
      size === 'sm' ? 'text-3xs' : 'text-2xs',
      '[&_code]:text-3xs [&_code]:text-secondary',
      'last:border-r-0'
    )}>
    {children}
  </th>
);
