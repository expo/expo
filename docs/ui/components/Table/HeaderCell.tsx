import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type HeaderCellProps = PropsWithChildren<{
  textAlign?: TextAlign;
}>;

export const HeaderCell = ({ children, textAlign = TextAlign.Left }: HeaderCellProps) => (
  <th css={[tableHeadersCellStyle, { textAlign }]}>{children}</th>
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
