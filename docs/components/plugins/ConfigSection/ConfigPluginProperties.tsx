import type { PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';

import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { StatusTag } from '~/ui/components/Tag';
import { P, CODE, H3 } from '~/ui/components/Text';

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
              {property.experimental && <StatusTag status="experimental" className="mb-2" />}
              {!!property.platform && (
                <APISectionPlatformTags
                  platforms={[
                    { content: [{ kind: 'text', text: property.platform }], tag: 'platform' },
                  ]}
                  prefix="Only for:"
                />
              )}
              <ReactMarkdown components={mdComponents}>{property.description}</ReactMarkdown>
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
  experimental?: boolean;
};
