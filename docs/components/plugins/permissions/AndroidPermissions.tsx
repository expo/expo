import { css } from '@emotion/react';
import { useMemo } from 'react';

import { androidPermissions, AndroidPermission, PermissionReference } from './data';

import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { CODE, P, createPermalinkedComponent } from '~/ui/components/Text';

// TODO(cedric): all commented code is related to the "granter" column.
// This column defines if the permission is granted by the system or user (requires notification).
// We have to clearly communicate what it means before showing it to the user.

type AndroidPermissionsProps = {
  permissions: PermissionReference<AndroidPermission>[];
};

// const grantedByInfo = 'Some permissions are granted by the system without user approval';

export function AndroidPermissions({ permissions }: AndroidPermissionsProps) {
  const list = useMemo(() => getPermissions(permissions), [permissions]);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Android Permission</HeaderCell>
          {/* <HeaderCell>
            <span css={grantedByInfoStyle} title={grantedByInfo}>
              Granted by <QuestionIcon size={12} title={grantedByInfo} />
            </span>
          </HeaderCell> */}
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
      {/* <Cell>
        <i>{getPermissionGranter(permission)}</i>
      </Cell> */}
      <Cell>
        {!!description && (
          <P css={(warning || explanation) && descriptionSpaceStyle}>{description}</P>
        )}
        {!!warning && (
          <Callout css={quoteStyle} type="warning">
            {warning}
          </Callout>
        )}
        {explanation && !warning && (
          <Callout css={quoteStyle}>
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

// const grantedByInfoStyle = css`
//   white-space: nowrap;
// `;

const descriptionSpaceStyle = css`
  margin-bottom: 1rem;
`;

const quoteStyle = css`
  margin-bottom: 0;
`;

// function getPermissionGranter(permission: AndroidPermission): 'user' | 'system' | 'none' {
//   if (!permission.protection) return 'none';
//   if (permission.protection.includes('dangerous')) return 'user';
//   return 'system';
// }
