import React from 'react';

import { IOSPermission, iosPermissions, PermissionReference } from './data';

import Permalink from '~/components/Permalink';
import { InlineCode } from '~/components/base/code';

type IOSPermissionsProps = {
  permissions: PermissionReference<IOSPermission>[];
};

export function IOSPermissions(props: IOSPermissionsProps) {
  const list = React.useMemo(() => getPermissions(props.permissions), [props.permissions]);

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
              <Permalink id={`permission-${permission.name.toLowerCase()}`}>
                <span>
                  <InlineCode>{permission.name}</InlineCode>
                </span>
              </Permalink>
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

function getPermissions(permissions: IOSPermissionsProps['permissions']) {
  return permissions
    .map(permission =>
      typeof permission === 'string'
        ? iosPermissions[permission]
        : { ...iosPermissions[permission.name], ...permission }
    )
    .filter(Boolean);
}
