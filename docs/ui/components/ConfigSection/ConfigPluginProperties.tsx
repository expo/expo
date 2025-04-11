import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';

import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { STYLES_SECONDARY } from '~/components/plugins/api/styles';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { PlatformTags } from '~/ui/components/Tag/PlatformTags';
import { StatusTag } from '~/ui/components/Tag/StatusTag';
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
            <Cell>
              <CODE>{property.name}</CODE>
            </Cell>
            <Cell>{!property.default ? '-' : <CODE>{property.default}</CODE>}</Cell>
            <Cell className="min-w-[320px]">
              <div className="mb-2 inline-flex empty:hidden">
                {(property.experimental || property.deprecated) && (
                  <div className="inline-flex flex-row flex-wrap">
                    {property.deprecated && (
                      <>
                        <StatusTag status="deprecated" className="!mr-0" />
                        <span className={mergeClasses(STYLES_SECONDARY)}>&ensp;&bull;&ensp;</span>
                      </>
                    )}
                    {property.experimental && (
                      <>
                        <StatusTag status="experimental" className="!mr-0" />
                        <span className={mergeClasses(STYLES_SECONDARY)}>&ensp;&bull;&ensp;</span>
                      </>
                    )}
                  </div>
                )}
                {!!property.platform && (
                  <PlatformTags prefix="Only for:" platforms={[property.platform]} />
                )}
              </div>
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
  deprecated?: boolean;
};
