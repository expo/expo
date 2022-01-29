import { css } from '@emotion/react';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from './types';

type CellProps = PropsWithChildren<{
  textAlign?: TextAlign;
}>;

export const Cell = ({ children, textAlign }: CellProps) => (
  <td css={css({ borderBottom: 0, verticalAlign: 'middle', wordBreak: 'break-word', textAlign })}>
    {children}
  </td>
);
