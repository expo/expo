import { mergeClasses } from '@expo/styleguide';
import { useMemo } from 'react';

import { androidPermissions, AndroidPermission, PermissionReference } from './data';

import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { CODE, P, createPermalinkedComponent } from '~/ui/components/Text';

// TODO(cedric): all commented code is related to the "granter" column.
// This column defines if the permission is granted by the system or user (requires notification).
// We have to clearly communicate what it means before showing it to the user.
// const grantedByInfo = 'Some permissions are granted by the system without user approval';

type AndroidPermissionsProps = {
  permissions: PermissionReference<AndroidPermission>[];
};

export function AndroidPermissions({ permissions }: AndroidPermissionsProps) {
  const list = useMemo(() => getPermissions(permissions), [permissions]);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Android Permission</HeaderCell>
          {/* <HeaderCell>Granted by <QuestionIcon size={12} title={grantedByInfo} /></HeaderCell> */}
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {list.map(permission => (
          <AndroidPermissionRow key={permission.name} {...permission} />
        ))}
      </tbody>
    </Table>
  );
}

const PermissionPermalink = createPermalinkedComponent(P, {
  baseNestingLevel: 4,
  iconSize: 'xs',
  className: 'inline-flex items-center',
});

function AndroidPermissionRow({
  name,
  description,
  explanation,
  warning,
  apiDeprecated,
}: AndroidPermission) {
  return (
    <Row subtle={!!apiDeprecated}>
      <Cell>
        <PermissionPermalink id={`permission-${name.toLowerCase()}`}>
          <CODE>{name}</CODE>
        </PermissionPermalink>
      </Cell>
      {/* <Cell>{getPermissionGranter(permission)}</Cell> */}
      <Cell>
        {!!description && (
          <P className={mergeClasses((warning || explanation) && '!mb-4')}>{description}</P>
        )}
        {!!warning && (
          <Callout className="mt-1.5 mb-0" type="warning">
            {warning}
          </Callout>
        )}
        {explanation && !warning && (
          <Callout className="mt-1.5 mb-0">
            <span dangerouslySetInnerHTML={{ __html: explanation }} />
          </Callout>
        )}
      </Cell>
    </Row>
  );
}

function getPermissions(permissions: AndroidPermissionsProps['permissions']) {
  return permissions
    .map(permission =>
      typeof permission === 'string'
        ? androidPermissions[permission]
        : { ...androidPermissions[permission.name], ...permission }
    )
    .filter(Boolean);
}

// function getPermissionGranter(permission: AndroidPermission): 'user' | 'system' | 'none' {
//   if (!permission.protection) return 'none';
//   if (permission.protection.includes('dangerous')) return 'user';
//   return 'system';
// }
