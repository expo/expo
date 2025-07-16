import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

type GridCellProps = PropsWithChildren<{
  className?: string;
}>;

export const GridCell = ({ children, className }: GridCellProps) => (
  <div
    className={mergeClasses(
      'relative min-h-[186px] overflow-hidden rounded-lg border border-default px-6 py-5 shadow-xs',
      '[&_h2]:!my-0 [&_h3]:!mt-0',
      className
    )}>
    {children}
  </div>
);
