import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React from 'react';

import { Row } from '~/ui/components/table/Row';
import { TextAlign } from '~/ui/components/table/Table.shared';

type TableHeadProps = {
  headers: string[];
  headersAlign?: TextAlign[];
};

export const TableHead = ({ headers, headersAlign }: TableHeadProps) => (
  <thead>
    <Row>
      {headers.map((header, i) => (
        <th
          key={header}
          css={[
            tableHeadersCellStyle,
            headersAlign && { textAlign: headersAlign[i] || TextAlign.Left },
          ]}>
          {header}
        </th>
      ))}
    </Row>
  </thead>
);

const tableHeadersCellStyle = css({
  color: theme.text.secondary,
  fontFamily: 'expo-brand-book',
  verticalAlign: 'middle',
});
