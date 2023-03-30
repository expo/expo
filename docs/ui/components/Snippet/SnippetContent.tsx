import { css } from '@emotion/react';
import { mergeClasses } from '@expo/styleguide';
import { forwardRef, PropsWithChildren } from 'react';

export type SnippetContentProps = PropsWithChildren<{
  alwaysDark?: boolean;
  hideOverflow?: boolean;
  skipPadding?: boolean;
  className?: string;
}>;

export const SnippetContent = forwardRef<HTMLDivElement, SnippetContentProps>(
  (
    {
      children,
      className,
      alwaysDark = false,
      hideOverflow = false,
      skipPadding = false,
    }: SnippetContentProps,
    ref
  ) => (
    <div
      ref={ref}
      css={[contentStyle, hideOverflow && contentHideOverflow]}
      className={mergeClasses(
        'text-default bg-subtle border border-default rounded-b-md overflow-x-auto p-4',
        alwaysDark && 'bg-palette-black border-transparent whitespace-nowrap',
        hideOverflow && 'overflow-hidden',
        skipPadding && 'p-0',
        className
      )}>
      {children}
    </div>
  )
);

const contentStyle = css`
  code {
    padding-left: 0;
    padding-right: 0;
  }
`;

const contentHideOverflow = css`
  code {
    white-space: nowrap;
  }
`;
