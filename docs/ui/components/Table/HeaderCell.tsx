import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type HeaderCellProps = PropsWithChildren<{
  textAlign?: TextAlign;
}>;

export const HeaderCell = ({ children, textAlign }: HeaderCellProps) => (
  <th css={[tableHeadersCellStyle, textAlign && { textAlign }]}>{children}</th>
);

const tableHeadersCellStyle = css({
  color: theme.text.default,
  fontFamily: typography.fontFaces.medium,
  verticalAlign: 'middle',
});
