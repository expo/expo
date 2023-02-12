import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

type SnippetProps = {
  includeMargin?: boolean;
  className?: string;
};

export const Snippet = ({
  children,
  className,
  includeMargin = true,
}: PropsWithChildren<SnippetProps>) => (
  <div css={[containerStyle, includeMargin && containerMarginStyle]} className={className}>
    {children}
  </div>
);

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
});

const containerMarginStyle = css({ marginBottom: spacing[4] });
