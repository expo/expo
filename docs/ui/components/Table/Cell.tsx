import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type CellProps = PropsWithChildren<{
  fitContent?: boolean;
  textAlign?: TextAlign;
}>;

export const Cell = ({ children, fitContent = false, textAlign = TextAlign.Left }: CellProps) => (
  <td css={[tableCellStyle, { textAlign }, fitContent && fitContentStyle]}>{children}</td>
);

const tableCellStyle = css({
  padding: spacing[4],
  verticalAlign: 'middle',
  wordBreak: 'break-word',
  borderRight: `1px solid ${theme.border.default}`,

  '&:last-child': {
    borderRight: 0,
  },
});

const fitContentStyle = css({
  width: 'fit-content',
  wordBreak: 'initial',
});
