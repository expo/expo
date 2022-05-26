import { css } from '@emotion/react';
import { theme, borderRadius, typography, spacing } from '@expo/styleguide';
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

const tableWrapperStyle = css({
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  overflow: 'hidden',
  marginBottom: spacing[4],
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
