import { css } from '@emotion/react';
import { theme, borderRadius, typography, spacing, shadows } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TableHeaders } from './TableHeaders';
import { TableLayout, TextAlign } from './types';

type TableProps = PropsWithChildren<{
  headers?: string[];
  headersAlign?: TextAlign[];
  layout?: TableLayout;
}>;

export const Table = ({
  children,
  headers = [],
  headersAlign,
  layout = TableLayout.Auto,
}: TableProps) => (
  <div css={tableWrapperStyle}>
    <table css={[tableStyle, { tableLayout: layout }]}>
      {headers.length ? (
        <>
          <TableHeaders headers={headers} headersAlign={headersAlign} />
          <tbody>{children}</tbody>
        </>
      ) : (
        children
      )}
    </table>
  </div>
);

export const tableWrapperStyle = css({
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  overflowY: 'hidden',
  overflowX: 'auto',
  marginBottom: spacing[4],
  boxShadow: shadows.micro,

  '::-webkit-scrollbar': {
    height: 6,
  },

  '::-webkit-scrollbar-track': {
    background: theme.background.default,
    borderBottomLeftRadius: borderRadius.medium,
    borderBottomRightRadius: borderRadius.medium,
  },

  '::-webkit-scrollbar-thumb': {
    background: theme.background.tertiary,
    borderRadius: borderRadius.medium,

    ':hover': {
      background: theme.background.quaternary,
    },
  },
});

const tableStyle = css({
  ...typography.fontSizes[14],
  width: '100%',
  border: 0,
  borderRadius: 0,
  marginBottom: 0,
  borderCollapse: 'collapse',
  color: theme.text.default,

  'blockquote, li': {
    ...typography.fontSizes[14],
  },
});
