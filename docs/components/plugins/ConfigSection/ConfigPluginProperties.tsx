import React, { PropsWithChildren } from 'react';

import { InlineCode } from '~/components/base/code';
import { P } from '~/components/base/paragraph';
import { H3 } from '~/components/plugins/Headings';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

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
              <InlineCode>{property.name}</InlineCode>
            </Cell>
            <Cell>{!property.default ? '-' : <InlineCode>{property.default}</InlineCode>}</Cell>
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
