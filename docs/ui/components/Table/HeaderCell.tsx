import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlign } from './utils';

type HeaderCellProps = PropsWithChildren<{
  align?: TextAlign | 'char';
  size?: 'md' | 'sm';
}>;

export const HeaderCell = ({ children, align = 'left', size = 'md' }: HeaderCellProps) => (
  <th
    css={[
      tableHeadersCellStyle,
      { textAlign: convertAlign(align), fontSize: size === 'sm' ? '0.75rem' : '0.875rem' },
    ]}>
    {children}
  </th>
);

const tableHeadersCellStyle = css({
  padding: spacing[4],
  fontWeight: 500,
  color: theme.text.secondary,
  verticalAlign: 'middle',
  borderRight: `1px solid ${theme.border.default}`,

  '&:last-child': {
    borderRight: 0,
  },
});
