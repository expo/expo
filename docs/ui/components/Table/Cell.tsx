import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlignToClass } from './utils';

type CellProps = PropsWithChildren<{
  fitContent?: boolean;
  align?: TextAlign | 'char';
  colSpan?: number;
  className?: string;
}>;

export const Cell = ({
  children,
  colSpan,
  className,
  fitContent = false,
  align = 'left',
}: CellProps) => (
  <td
    className={mergeClasses(
      'border-r border-secondary p-4',
      convertAlignToClass(align),
      fitContent && 'w-fit',
      'last:border-r-0',
      className
    )}
    colSpan={colSpan}>
    {children}
  </td>
);
