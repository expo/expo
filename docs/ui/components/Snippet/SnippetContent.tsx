import { mergeClasses } from '@expo/styleguide';
import { forwardRef, PropsWithChildren } from 'react';

export type SnippetContentProps = PropsWithChildren<{
  alwaysDark?: boolean;
  hideOverflow?: boolean;
  className?: string;
}>;

export const SnippetContent = forwardRef<HTMLDivElement, SnippetContentProps>(
  ({ children, className, alwaysDark = false, hideOverflow = false }: SnippetContentProps, ref) => (
    <div
      ref={ref}
      className={mergeClasses(
        'text-default bg-subtle border border-default rounded-b-md overflow-x-auto p-4 !leading-[19px]',
        'prose-code:!px-0',
        alwaysDark && 'dark-theme bg-palette-black border-transparent whitespace-nowrap',
        hideOverflow && 'overflow-hidden prose-code:!whitespace-nowrap',
        className
      )}>
      {children}
    </div>
  )
);
