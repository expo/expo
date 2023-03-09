import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
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
      css={[
        contentStyle,
        alwaysDark && contentDarkStyle,
        hideOverflow && contentHideOverflow,
        skipPadding && skipPaddingStyle,
      ]}
      className={className}>
      {children}
    </div>
  )
);

const contentStyle = css`
  color: ${theme.text.default};
  background-color: ${theme.background.subtle};
  border: 1px solid ${theme.border.default};
  border-bottom-left-radius: ${borderRadius.md}px;
  border-bottom-right-radius: ${borderRadius.md}px;
  padding: ${spacing[4]}px;
  overflow-x: auto;

  code {
    padding-left: 0;
    padding-right: 0;
  }
`;

const contentDarkStyle = css`
  background-color: ${theme.palette.black};
  border-color: transparent;
  white-space: nowrap;
`;

const contentHideOverflow = css`
  overflow: hidden;

  code {
    white-space: nowrap;
  }
`;

const skipPaddingStyle = css({
  padding: 0,
});
