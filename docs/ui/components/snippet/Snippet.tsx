import { css } from '@emotion/react';
import React, { PropsWithChildren } from 'react';

export const Snippet = ({ children }: PropsWithChildren<object>) => (
  <div css={containerStyle}>{children}</div>
);

const containerStyle = css`
  display: flex;
  flex-direction: column;
  margin-bottom: 1ch;
`;
