import React from 'react';

import { HeaderCell } from '~/ui/components/Table/HeaderCell';
import { Row } from '~/ui/components/Table/Row';
import { TextAlign } from '~/ui/components/Table/Table.shared';

type TableHeadProps = {
  headers: string[];
  headersAlign?: TextAlign[];
};

export const TableHead = ({ headers, headersAlign }: TableHeadProps) => (
  <thead>
    <Row>
      {headers.map((header, i) => (
        <HeaderCell key={i} textAlign={(headersAlign && headersAlign[i]) || TextAlign.Left}>
          {header}
        </HeaderCell>
      ))}
    </Row>
  </thead>
);
