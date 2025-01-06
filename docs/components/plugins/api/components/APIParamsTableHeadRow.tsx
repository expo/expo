import { HeaderCell, Row, TableHead } from '~/ui/components/Table';

export const APIParamsTableHeadRow = ({ hasDescription = true, mainCellLabel = 'Name' }) => (
  <TableHead>
    <Row>
      <HeaderCell size="sm">{mainCellLabel}</HeaderCell>
      <HeaderCell size="sm">Type</HeaderCell>
      {hasDescription && <HeaderCell size="sm">Description</HeaderCell>}
    </Row>
  </TableHead>
);
