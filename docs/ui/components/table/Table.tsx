import { css } from '@emotion/react';
import { theme, borderRadius } from '@expo/styleguide';
import React from 'react';

import { TextAlign } from '~/ui/components/table/Table.shared';
import { TableHead } from '~/ui/components/table/TableHead';

type TableProps = {
  headers?: string[];
  headersAlign?: TextAlign[];
  children: React.ReactNode;
};

export const Table = ({ children, headers = [], headersAlign = [] }: TableProps) => (
  <div css={tableWrapperStyle}>
    <table css={tableStyle}>
      {headers.length && <TableHead headers={headers} headersAlign={headersAlign} />}
      <tbody>{children}</tbody>
    </table>
  </div>
);

const tableWrapperStyle = css({
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
  borderRadius: borderRadius.large,
  overflow: 'hidden',
  marginBottom: '1rem',
});

const tableStyle = css({ border: 0, borderRadius: 0, marginBottom: 0, fontSize: 14 });
