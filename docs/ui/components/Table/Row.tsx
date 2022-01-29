import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

type RowProps = PropsWithChildren<object>;

export const Row = ({ children }: RowProps) => <tr css={tableRowStyle}>{children}</tr>;

const tableRowStyle = css({
  borderBottomWidth: 1,
  borderBottomStyle: 'solid',
  borderBottomColor: theme.border.default,
  '&:last-child': {
    borderWidth: 0,
  },
  '&:nth-of-type(2n)': {
    backgroundColor: theme.background.secondary,
  },
});
