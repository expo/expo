import React, { PropsWithChildren } from 'react';

import { InlineCode } from '~/components/base/code';
import { B, P } from '~/components/base/paragraph';
import { H3 } from '~/components/plugins/Headings';

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
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {properties.map(property => (
          <tr key={property.name}>
            <td>
              <InlineCode>{property.name}</InlineCode>
            </td>
            <td>{!property.default ? '-' : <InlineCode>{property.default}</InlineCode>}</td>
            <td>
              {!!property.platform && <B>{platformNames[property.platform]} only </B>}
              {property.description}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

export type PluginProperty = {
  name: string;
  description: string;
  default?: string;
  platform?: 'android' | 'ios' | 'web';
};
