import assert from 'assert';

import { DefinitionRenderProps } from './Definition';
import { DefinitionDescription } from './DefinitionDescription';
import { DefinitionType } from './DefinitionType';

import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { BOLD, CALLOUT } from '~/ui/components/Text';

export default function DefinitionProperties({ schema, definition }: DefinitionRenderProps) {
  assert(definition.properties, 'Definition is a non-object type without properties');

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Property</HeaderCell>
          <HeaderCell>Type</HeaderCell>
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {Object.entries(definition.properties).map(([name, property]) => {
          const isRequired = definition.required && definition.required.includes(name);
          return (
            <Row key={name}>
              <Cell fitContent>
                <BOLD>{name}</BOLD>
                {isRequired && (
                  <CALLOUT theme="secondary" css={{ fontSize: '90%' }}>
                    required
                  </CALLOUT>
                )}
              </Cell>
              <Cell fitContent>
                <DefinitionType schema={schema} definition={property as any} />
              </Cell>
              <Cell>
                <DefinitionDescription schema={schema} definition={property as any} />
              </Cell>
            </Row>
          );
        })}
      </tbody>
    </Table>
  );
}
