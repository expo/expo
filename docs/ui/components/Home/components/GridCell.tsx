import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

type GridCellProps = PropsWithChildren<{
  className?: string;
}>;

export const GridCell = ({ children, className }: GridCellProps) => (
  <div
    className={mergeClasses(
      'relative min-h-[200px] overflow-hidden rounded-lg border border-default p-8 shadow-xs',
      '[&_h2]:!my-0 [&_h3]:!mt-0',
      className
    )}>
    {children}
  </div>
);
