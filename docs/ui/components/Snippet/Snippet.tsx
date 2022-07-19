import { css, SerializedStyles } from '@emotion/react';
import { spacing } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

type SnippetProps = {
  style?: SerializedStyles;
  includeMargin?: boolean;
};

export const Snippet = ({
  children,
  style,
  includeMargin = true,
}: PropsWithChildren<SnippetProps>) => (
  <div css={[containerStyle, includeMargin && containerMarginStyle, css(style)]}>{children}</div>
);

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
});

const containerMarginStyle = css({ marginBottom: spacing[4] });
