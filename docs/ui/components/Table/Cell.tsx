import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlignToClass } from './utils';

type CellProps = PropsWithChildren<{
  fitContent?: boolean;
  align?: TextAlign | 'char';
  colSpan?: number;
}>;

export const Cell = ({ children, colSpan, fitContent = false, align = 'left' }: CellProps) => (
  <td
    className={mergeClasses(
      'border-r border-secondary p-4',
      convertAlignToClass(align),
      fitContent && 'w-fit',
      'last:border-r-0',
      '[&>*:last-child]:!mb-0'
    )}
    colSpan={colSpan}>
    {children}
  </td>
);
