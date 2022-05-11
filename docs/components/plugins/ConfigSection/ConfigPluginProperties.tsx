import React, { PropsWithChildren } from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H3 } from '~/components/plugins/Headings';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

type Props = PropsWithChildren<{
  properties: PluginProperty[];
}>;

const platformNames: Record<Exclude<PluginProperty['platform'], undefined>, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
};

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
              {!!property.platform && <B>{platformNames[property.platform]} only </B>}
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
