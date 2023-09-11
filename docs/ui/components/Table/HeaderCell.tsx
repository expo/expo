import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { TextAlign } from './types';
import { convertAlign } from './utils';

type HeaderCellProps = PropsWithChildren<{
  align?: TextAlign | 'char';
}>;

export const HeaderCell = ({ children, align = 'left' }: HeaderCellProps) => (
  <th css={[tableHeadersCellStyle, { textAlign: convertAlign(align) }]}>{children}</th>
);

const tableHeadersCellStyle = css({
  padding: spacing[4],
  fontWeight: 600,
  verticalAlign: 'middle',
  borderRight: `1px solid ${theme.border.default}`,

  '&:last-child': {
    borderRight: 0,
  },
});
