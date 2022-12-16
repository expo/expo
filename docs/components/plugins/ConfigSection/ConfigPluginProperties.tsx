import React, { PropsWithChildren } from 'react';

import { H3 } from '~/components/plugins/Headings';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { P, CODE } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  properties: PluginProperty[];
}>;

export const ConfigPluginProperties = ({ children, properties }: Props) => (
  <>
    <H3>Configurable properties</H3>
    {!!children && <P>{children}</P>}
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Name</HeaderCell>
          <HeaderCell>Default</HeaderCell>
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {properties.map(property => (
          <Row key={property.name}>
            <Cell fitContent>
              <CODE>{property.name}</CODE>
            </Cell>
            <Cell>{!property.default ? '-' : <CODE>{property.default}</CODE>}</Cell>
            <Cell>
              {!!property.platform && (
                <APISectionPlatformTags
                  prefix="Only for:"
                  platforms={[{ text: property.platform, tag: 'platform' }]}
                />
              )}
              {property.description}
            </Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  </>
);

export type PluginProperty = {
  name: string;
  description: string;
  default?: string;
  platform?: 'android' | 'ios' | 'web';
};
