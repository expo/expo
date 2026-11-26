import { mergeClasses } from '@expo/styleguide';
import { Fragment, type PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';

import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { StatusTag } from '~/ui/components/Tag/StatusTag';
import { formatName } from '~/ui/components/Tag/helpers';
import { P, CODE, H3, MONOSPACE } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  properties: PluginProperty[];
}>;

export const ConfigPluginProperties = ({ children, properties }: Props) => (
  <>
    <H3>Configurable properties</H3>
    {!!children && <P>{children}</P>}
    <Table
      className={mergeClasses(
        '[&>thead]:sr-only',
        '[&>tbody>tr]:bg-transparent! [&>tbody>tr+tr]:border-t [&>tbody>tr+tr]:border-secondary',
        '[&>tbody>tr>td]:border-r-0 [&>tbody>tr>td]:align-top [&>tbody>tr>td:last-child]:wrap-anywhere [&>tbody>tr>td:last-child_code]:wrap-anywhere',
        'max-md:[&>tbody>tr]:flex max-md:[&>tbody>tr]:flex-col max-md:[&>tbody>tr>td:first-child]:pb-0'
      )}>
      <TableHead>
        <Row>
          <HeaderCell>Name</HeaderCell>
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {properties.map(property => (
          <Row key={property.name}>
            <Cell className="w-1/3 max-md:w-auto">
              <div className="flex flex-col items-start gap-2">
                <MONOSPACE weight="medium" className="text-sm text-default">
                  {property.name.split('.').map((part, index) => (
                    <Fragment key={`${index}-${part}`}>
                      {index > 0 && (
                        <>
                          .<wbr />
                        </>
                      )}
                      {part}
                    </Fragment>
                  ))}
                </MONOSPACE>
                {(property.deprecated || property.experimental || !!property.platform) && (
                  <div className="flex flex-wrap gap-1">
                    {property.deprecated && <StatusTag status="deprecated" className="mr-0!" />}
                    {property.experimental && <StatusTag status="experimental" className="mr-0!" />}
                    {!!property.platform && (
                      <span className="inline-flex min-h-6 items-center rounded-xl bg-element px-2.5 text-xs! text-secondary">
                        {formatName(property.platform)} only
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Cell>
            <Cell className="[&>p:last-child]:mb-0">
              <ReactMarkdown components={mdComponents}>{property.description}</ReactMarkdown>
              {property.default && (
                <div className="mt-3 flex flex-col items-start gap-1">
                  <span className="text-xs! font-medium text-secondary">
                    Default<span className="sr-only">:</span>
                  </span>{' '}
                  <CODE>{property.default}</CODE>
                </div>
              )}
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
