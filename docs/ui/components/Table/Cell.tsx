import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlign } from './utils';

type CellProps = PropsWithChildren<{
  fitContent?: boolean;
  align?: TextAlign | 'char';
  colSpan?: number;
}>;

export const Cell = ({ children, colSpan, fitContent = false, align = 'left' }: CellProps) => (
  <td
    css={[tableCellStyle, { textAlign: convertAlign(align) }, fitContent && fitContentStyle]}
    colSpan={colSpan}>
    {children}
  </td>
);

const tableCellStyle = css({
  padding: spacing[4],
  verticalAlign: 'middle',
  borderRight: `1px solid ${theme.border.default}`,

  '&:last-child': {
    borderRight: 0,
  },

  '> *:last-child': {
    marginBottom: '0 !important',
  },
});

const fitContentStyle = css({
  width: 'fit-content',
});
