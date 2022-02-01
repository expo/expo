import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

type RowProps = PropsWithChildren<object>;

export const Row = ({ children }: RowProps) => <tr css={tableRowStyle}>{children}</tr>;

const tableRowStyle = css({
  '&:nth-of-type(2n)': {
    backgroundColor: theme.background.secondary,
  },
});
