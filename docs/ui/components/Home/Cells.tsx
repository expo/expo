import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren } from 'react';

type GridContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function GridContainer({ children, className }: GridContainerProps) {
  return (
    <div
      className={mergeClasses(
        'inline-grid w-full grid-cols-2 gap-8 my-4',
        'max-xl-gutters:grid-cols-1',
        'max-lg-gutters:grid-cols-2',
        'max-md-gutters:grid-cols-1',
        className
      )}>
      {children}
    </div>
  );
}

type GridCellProps = PropsWithChildren<{
  className?: string;
}>;

export const GridCell = ({ children, className }: GridCellProps) => (
  <div
    className={mergeClasses(
      'p-8 min-h-[200px] overflow-hidden relative border border-default rounded-lg shadow-xs',
      '[&_h2]:!my-0 [&_h3]:!mt-0',
      className
    )}>
    {children}
  </div>
);
