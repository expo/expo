import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type HeaderCellProps = PropsWithChildren<{
  align?: TextAlign;
}>;

export const HeaderCell = ({ children, align = TextAlign.Left }: HeaderCellProps) => (
  <th css={[tableHeadersCellStyle, { textAlign: align }]}>{children}</th>
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
