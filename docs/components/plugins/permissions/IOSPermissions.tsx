import React from 'react';

import { IOSPermission, iosPermissions, PermissionReference } from './data';

import Permalink from '~/components/Permalink';
import { InlineCode } from '~/components/base/code';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

type IOSPermissionsProps = {
  permissions: PermissionReference<IOSPermission>[];
};

export function IOSPermissions(props: IOSPermissionsProps) {
  const list = React.useMemo(() => getPermissions(props.permissions), [props.permissions]);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Info.plist Key</HeaderCell>
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {list.map(permission => (
          <Row key={permission.name}>
            <Cell>
              <Permalink id={`permission-${permission.name.toLowerCase()}`}>
                <span>
                  <InlineCode>{permission.name}</InlineCode>
                </span>
              </Permalink>
            </Cell>
            <Cell>{permission.description}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
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
