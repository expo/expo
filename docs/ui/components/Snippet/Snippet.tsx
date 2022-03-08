import { css, SerializedStyles } from '@emotion/react';
import React, { PropsWithChildren } from 'react';

type SnippetProps = {
  style?: SerializedStyles;
};

export const Snippet = ({ children, style }: PropsWithChildren<SnippetProps>) => (
  <div css={[containerStyle, css(style)]}>{children}</div>
);

const containerStyle = css`
  display: flex;
  flex-direction: column;
  margin-bottom: 1ch;
`;
