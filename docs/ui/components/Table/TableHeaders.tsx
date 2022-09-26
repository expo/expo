import React from 'react';

import { HeaderCell } from './HeaderCell';
import { Row } from './Row';
import { TableHead } from './TableHead';
import { TextAlign } from './types';

type TableHeadersProps = {
  headers: string[];
  headersAlign?: TextAlign[];
};

export const TableHeaders = ({ headers, headersAlign = [] }: TableHeadersProps) => (
  <TableHead>
    <Row>
      {headers.map((header, i) => (
        <HeaderCell key={`table-header-${i}`} align={headersAlign[i]}>
          {header}
        </HeaderCell>
      ))}
    </Row>
  </TableHead>
);
