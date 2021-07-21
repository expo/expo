import React from 'react';

import { iosPermissions } from './data';

import { InlineCode } from '~/components/base/code';

type IOSPermissionsProps = {
  keys: string[];
};

export function IOSPermissions(props: IOSPermissionsProps) {
  const list = props.keys.map(key => iosPermissions[key]);

  return (
    <table>
      <thead>
        <tr>
          <th>Info.plist Key</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {list.map(permission => (
          <tr key={permission.name}>
            <td>
              <InlineCode>{permission.name}</InlineCode>
            </td>
            <td>
              <p>{permission.description}</p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
