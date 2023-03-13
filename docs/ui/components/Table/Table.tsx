import { css } from '@emotion/react';
import { theme, typography, shadows } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

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
  borderRadius: borderRadius.md,
  overflowY: 'hidden',
  overflowX: 'auto',
  marginBottom: spacing[4],
  boxShadow: shadows.xs,

  '::-webkit-scrollbar': {
    height: 6,
  },

  '::-webkit-scrollbar-track': {
    background: theme.background.default,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },

  '::-webkit-scrollbar-thumb': {
    background: theme.background.element,
    borderRadius: borderRadius.md,

    ':hover': {
      background: theme.background.hover,
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

  'blockquote div, li, p, strong': {
    ...typography.fontSizes[14],
  },

  'blockquote code': {
    padding: `0 ${spacing[1]}px`,
  },
});
