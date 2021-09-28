import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TextAlign } from '~/ui/components/Table/Table.shared';

type HeaderCellProps = {
  textAlign?: TextAlign;
  key?: string | number;
};

export const HeaderCell = ({ children, textAlign, key }: PropsWithChildren<HeaderCellProps>) => (
  <th key={key} css={[tableHeadersCellStyle, textAlign && { textAlign }]}>
    {children}
  </th>
);

const tableHeadersCellStyle = css({
  color: theme.text.secondary,
  fontFamily: 'expo-brand-book',
  verticalAlign: 'middle',
});
