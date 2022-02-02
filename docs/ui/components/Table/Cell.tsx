import { css } from '@emotion/react';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type CellProps = PropsWithChildren<{
  textAlign?: TextAlign;
}>;

export const Cell = ({ children, textAlign = TextAlign.Left }: CellProps) => (
  <td css={[tableCellStyle, { textAlign }]}>{children}</td>
);

const tableCellStyle = css({
  borderBottom: 0,
  verticalAlign: 'middle',
  wordBreak: 'break-word',
});
