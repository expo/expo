import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

type TableHeadProps = PropsWithChildren<object>;

export const TableHead = ({ children }: TableHeadProps) => (
  <thead css={tableHeadStyle}>{children}</thead>
);

const tableHeadStyle = css({
  backgroundColor: theme.background.subtle,
  borderBottom: `1px solid ${theme.border.default}`,
});
