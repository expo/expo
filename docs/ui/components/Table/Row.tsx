import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

type RowProps = object;

export const Row = ({ children }: PropsWithChildren<RowProps>) => (
  <tr css={tableRowStyle}>{children}</tr>
);

const tableRowStyle = css({
  borderBottomWidth: 1,
  borderBottomStyle: 'solid',
  borderBottomColor: theme.border.default,
  '&:last-child': {
    borderWidth: 0,
  },
  '&:nth-child(2n)': {
    backgroundColor: theme.background.secondary,
  },
});
