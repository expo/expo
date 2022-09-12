import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

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
  fontFamily: typography.fontFaces.medium,
  verticalAlign: 'middle',
  borderRight: `1px solid ${theme.border.default}`,

  '&:last-child': {
    borderRight: 0,
  },
});
