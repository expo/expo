import { css } from '@emotion/react';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from '~/ui/components/Table/Table.shared';

type CellProps = {
  textAlign?: TextAlign;
};

export const Cell = ({ children, textAlign }: PropsWithChildren<CellProps>) => (
  <td css={css({ borderBottom: 0, verticalAlign: 'middle', textAlign })}>{children}</td>
);
