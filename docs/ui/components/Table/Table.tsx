import { css } from '@emotion/react';
import { theme, borderRadius } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { TableHeaders } from './TableHeaders';
import { TextAlign } from './types';

type TableProps = PropsWithChildren<{
  headers?: string[];
  headersAlign?: TextAlign[];
}>;

export const Table = ({ children, headers = [], headersAlign }: TableProps) => (
  <div css={tableWrapperStyle}>
    <table css={tableStyle}>
      {headers.length ? (
        <>
          <TableHeaders headers={headers} headersAlign={headersAlign} />
          <tbody>{children}</tbody>
        </>
      ) : (
        children
      )}
    </table>
  </div>
);

const tableWrapperStyle = css({
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
  borderRadius: borderRadius.medium,
  overflow: 'hidden',
  marginBottom: '1rem',
});

const tableStyle = css({ border: 0, borderRadius: 0, marginBottom: 0, fontSize: 14 });
