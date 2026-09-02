import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren } from 'react';

type GridContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function GridContainer({ children, className }: GridContainerProps) {
  return (
    <div
      className={mergeClasses(
        'my-4 inline-grid w-full grid-cols-2 gap-8',
        'max-xl:grid-cols-1',
        'max-lg:grid-cols-2',
        'max-md:grid-cols-1',
        className
      )}>
      {children}
    </div>
  );
}
