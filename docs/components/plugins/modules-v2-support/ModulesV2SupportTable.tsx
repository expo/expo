import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

import { getLanguageStatusLabel, modulesV2Features } from './data';

/**
 * Lists the Expo Modules API 2.0 features with their status in Kotlin and Swift.
 */
export function ModulesV2SupportTable() {
  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Feature</HeaderCell>
          <HeaderCell>Kotlin</HeaderCell>
          <HeaderCell>Swift</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {modulesV2Features.map(feature => (
          <Row key={feature.id}>
            <Cell>
              {feature.name}
              {feature.note ? ` (${feature.note})` : null}
            </Cell>
            <Cell>{getLanguageStatusLabel(feature.kotlin)}</Cell>
            <Cell>{getLanguageStatusLabel(feature.swift)}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
}
